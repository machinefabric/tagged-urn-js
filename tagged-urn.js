// Tagged URN JavaScript Implementation
// Follows the exact same rules as Rust, Go, and Objective-C implementations.
//
// What two URNs mean to each other — refinement, equivalence, comparability,
// specificity, one key's match — is decided by code generated from the proved
// model in ../formal (Lean) by lungo, in ./formal, not written here. It runs as
// WebAssembly, instantiated once when this module is first imported.
//
// Each tag is stored as the constraint it writes: a frozen `{ kind, value? }`,
// the model's own Constraint, whose kinds are the model's seven.

import { load } from './formal/index.js';

const model = await load();

/**
 * Error types for Tagged URN operations
 */
class TaggedUrnError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TaggedUrnError';
    this.code = code;
  }
}

// Error codes. Code 7 is not used.
const ErrorCodes = {
  INVALID_FORMAT: 1,
  EMPTY_TAG: 2,
  INVALID_CHARACTER: 3,
  INVALID_TAG_FORMAT: 4,
  MISSING_PREFIX: 5,
  DUPLICATE_KEY: 6,
  UNTERMINATED_QUOTE: 8,
  INVALID_ESCAPE_SEQUENCE: 9,
  EMPTY_PREFIX: 10,
  PREFIX_MISMATCH: 11,
  WHITESPACE_IN_INPUT: 12
};

/**
 * What a tag writes about its key: the model's Constraint, a frozen
 * `{ kind, value? }`. `missing` stands for a key a URN omits and is never
 * stored. Compare two with `Constraint.equals`.
 */
const Constraint = Object.freeze({
  missing: () => Object.freeze({ kind: 'missing' }),
  unconstrained: () => Object.freeze({ kind: 'unconstrained' }),
  optionalNot: (value) => Object.freeze({ kind: 'optionalNot', value }),
  present: () => Object.freeze({ kind: 'present' }),
  presentNot: (value) => Object.freeze({ kind: 'presentNot', value }),
  exact: (value) => Object.freeze({ kind: 'exact', value }),
  absent: () => Object.freeze({ kind: 'absent' }),
  /** Whether two constraints are the same form with the same value. */
  equals: (a, b) => a !== undefined && b !== undefined && a.kind === b.kind && a.value === b.value,
});

const VALUED_KINDS = new Set(['optionalNot', 'presentNot', 'exact']);
const BARE_KINDS = new Set(['unconstrained', 'present', 'absent']);

// Parser states for state machine.
//
// The parser reads the six tag forms — the canonical alphabet of the
// constraint truth table — into the constraint each writes:
//
//   | Authored                 | Canonical | Constraint     | Score | Reading                       |
//   |--------------------------|-----------|----------------|------:|-------------------------------|
//   | `?x` ≡ `x?` ≡ `x=?`      | `?x`      | unconstrained  |     0 | no constraint                 |
//   | `?x=v` ≡ `x?=v` ≡ `x=?v` | `x?=v`    | optionalNot v  |     1 | absent OR (present and not v) |
//   | `x` ≡ `x=*`              | `x`       | present        |     2 | present with any value        |
//   | `!x=v` ≡ `x!=v` ≡ `x=!v` | `x!=v`    | presentNot v   |     3 | present and not v             |
//   | `x=v`                    | `x=v`     | exact v        |     4 | present and exactly v         |
//   | `!x` ≡ `x!` ≡ `x=!`      | `!x`      | absent         |     5 | absent (must-not-have)        |
//
// A quoted value is literal: `x="?v"` is the exact value `?v`, and `x="*"`
// the exact value `*`, never the marker.
//
// Disallowed (hard parse errors): `?x?`, `?x?=v`, `!x!=v`, `?!x`, `!?x`,
// `?x=?v`, `?x=*`, `!x=*`, `x=?*`, `x=!?`, and an empty value.
const ParseState = {
  EXPECTING_KEY: 0,
  AFTER_PREFIX_QUESTION: 1,
  AFTER_PREFIX_BANG: 2,
  IN_KEY: 3,
  IN_KEY_AFTER_QUESTION: 4,
  IN_KEY_AFTER_BANG: 5,
  EXPECTING_VALUE: 6,
  IN_UNQUOTED_VALUE: 7,
  IN_QUOTED_VALUE: 8,
  IN_QUOTED_VALUE_ESCAPE: 9,
  EXPECTING_SEMI_OR_END: 10
};

/** Whether a character may begin a prefix or a key: an ASCII letter. */
function isIdentifierStart(c) {
  return /^[a-zA-Z]$/.test(c);
}

/** Whether a character may stand in a prefix or key after its first. */
function isValidKeyChar(c) {
  return /^[a-zA-Z0-9-]$/.test(c);
}

/**
 * `s` as an identifier — an ASCII letter, then ASCII letters, digits and `-` —
 * lowered; `what` names it in the error ("prefix", "key").
 */
function identifier(what, s) {
  if (typeof s !== 'string' || s === '') {
    if (what === 'prefix') {
      throw new TaggedUrnError(ErrorCodes.EMPTY_PREFIX, 'Tagged URN prefix cannot be empty');
    }
    throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty ${what}`);
  }
  const chars = [...s];
  for (let pos = 0; pos < chars.length; pos++) {
    const c = chars[pos];
    const allowed = pos === 0 ? isIdentifierStart(c) : isValidKeyChar(c);
    if (!allowed) {
      throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `invalid character '${c}' in ${what} at position ${pos}`);
    }
  }
  return s.toLowerCase();
}

/**
 * A constraint a URN can write for `key`, frozen: one of the model's forms
 * other than `missing`, with a non-empty value where it has one.
 */
function checkedConstraint(key, constraint) {
  const kind = constraint === null || constraint === undefined ? undefined : constraint.kind;
  if (VALUED_KINDS.has(kind)) {
    if (typeof constraint.value !== 'string' || constraint.value === '') {
      throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${key}'`);
    }
    return Object.freeze({ kind, value: constraint.value });
  }
  if (BARE_KINDS.has(kind)) {
    return Object.freeze({ kind });
  }
  throw new TaggedUrnError(
    ErrorCodes.INVALID_TAG_FORMAT,
    `key '${key}' given ${JSON.stringify(constraint)}: a tag's value is a constraint, and a key with no constraint is omitted`
  );
}

/**
 * Whether a character may stand in an unquoted value: anything but the
 * separators `;` `=`, the quoting characters `"` `\`, and whitespace.
 */
function isValidUnquotedValueChar(c) {
  return !/[;="\\\s]/u.test(c);
}

/** An ASCII letter lowered, any other character as it is: unquoted values are lowered so. */
function asciiLower(c) {
  return /^[A-Z]$/.test(c) ? c.toLowerCase() : c;
}

/**
 * Whether a value must be quoted to read back as itself: it holds a character
 * a bare value cannot, an uppercase letter (a bare value is lowered), or
 * begins with `*`, `?` or `!` (which a bare value reads as a sigil or a
 * qualifier).
 */
function needsQuoting(value) {
  for (const c of value) {
    if (!isValidUnquotedValueChar(c) || c !== c.toLowerCase()) {
      return true;
    }
  }
  return value.startsWith('*') || value.startsWith('?') || value.startsWith('!');
}

/**
 * Quote a value for serialization
 */
function quoteValue(value) {
  let result = '"';
  for (const c of value) {
    if (c === '"' || c === '\\') {
      result += '\\';
    }
    result += c;
  }
  result += '"';
  return result;
}

/** A value as it is written: bare, or quoted when it must be. */
function writeValue(value) {
  return needsQuoting(value) ? quoteValue(value) : value;
}

/** The constraint a value writes under a qualifier (or none). */
function qualified(qualifier, value) {
  if (qualifier === null) return Constraint.exact(value);
  if (qualifier === '?') return Constraint.optionalNot(value);
  if (qualifier === '!') return Constraint.presentNot(value);
  throw new Error(`invalid qualifier ${qualifier}`);
}

/** A qualifier and a sigil (`*`, `?`, `!`) make incompatible claims. */
function refuseSigilUnderQualifier(qualifier, key, value) {
  if (value === '*' || value === '?' || value === '!') {
    throw new TaggedUrnError(
      ErrorCodes.INVALID_CHARACTER,
      `qualifier '${qualifier}' on key '${key}' cannot combine with sigil value '${value}': ` +
      `use a real value or drop the qualifier`
    );
  }
}

/** The constraint of a value-less tag, given its qualifier. */
function canonicalNoValue(qualifier) {
  if (qualifier === null) return Constraint.present();
  if (qualifier === '?') return Constraint.unconstrained();
  if (qualifier === '!') return Constraint.absent();
  throw new Error(`invalid qualifier ${qualifier}`);
}

/**
 * The constraint a parsed (qualifier, value) pair writes. A quoted value is
 * literal: exact, or optionalNot/presentNot under a qualifier. An unquoted
 * `*`, `?` or `!` is a sigil; an unquoted value that begins with `?` or `!`
 * is that qualifier (`x=?v` ≡ `x?=v`). A qualifier on an unquoted sigil, or a
 * second qualifier, is refused.
 */
function canonicalizeValue(qualifier, quoted, key, value) {
  if (value === '') {
    throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${key}'`);
  }
  if (quoted) return qualified(qualifier, value);
  if (qualifier === null) {
    if (value === '*') return Constraint.present();
    if (value === '?') return Constraint.unconstrained();
    if (value === '!') return Constraint.absent();
    if (value[0] === '?' || value[0] === '!') {
      const rest = value.slice(1);
      refuseSigilUnderQualifier(value[0], key, rest);
      return qualified(value[0], rest);
    }
    return Constraint.exact(value);
  }
  if (value.length > 1 && (value[0] === '?' || value[0] === '!')) {
    throw new TaggedUrnError(
      ErrorCodes.INVALID_CHARACTER,
      `qualifier '${qualifier}' on key '${key}' cannot combine with a second qualifier in value '${value}': ` +
      `quote the value to make it literal`
    );
  }
  refuseSigilUnderQualifier(qualifier, key, value);
  return qualified(qualifier, value);
}

const TaggedUrnRelationKind = Object.freeze({
  EQUIVALENT: 'equivalent',
  COMPARABLE: 'comparable',
  INCOMPARABLE: 'incomparable',
});

class TaggedUrnCoordinateDelta {
  constructor(prefix, removed = {}, added = {}, relationKind = TaggedUrnRelationKind.EQUIVALENT) {
    this.prefix = prefix.toLowerCase();
    this.removed = { ...removed };
    this.added = { ...added };
    this.relationKind = relationKind;
  }

  isEmpty() {
    return Object.keys(this.removed).length === 0 && Object.keys(this.added).length === 0;
  }
}

/**
 * Orders strings by code point, as Lean's `String <` does. JavaScript's own
 * comparison is by UTF-16 code unit, which disagrees past U+FFFF: a surrogate
 * pair sorts below U+E000..U+FFFF, and the model would refuse the keys as out
 * of order.
 */
function compareCodePoints(a, b) {
  const x = [...a];
  const y = [...b];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = x[i].codePointAt(0) - y[i].codePointAt(0);
    if (d !== 0) return d;
  }
  return x.length - y.length;
}

const FORM_ORDER = Object.freeze({
  unconstrained: 0,
  optionalNot: 1,
  present: 2,
  presentNot: 3,
  exact: 4,
  absent: 5,
});

/** A stored constraint's form's place in the order of URNs: the truth table's. */
function formOrder(c) {
  const order = FORM_ORDER[c.kind];
  if (order === undefined) {
    throw new Error(`tagged-urn: stored constraint ${JSON.stringify(c)}`);
  }
  return order;
}

/**
 * Whether an instance's constraint satisfies a pattern's at one key
 * (`Constraint.missing()` for a key the URN omits, as `TaggedUrn.constraint`
 * gives it). Decided by the model: every form has one meaning — the set of
 * states the key may be in — and the instance satisfies the pattern when
 * every state it allows, the pattern allows too (`tagMatch_iff_allows` in
 * ../formal).
 */
function valuesMatch(inst, patt) {
  return model.valuesMatch(inst, patt);
}

/** Whether two constraints allow a common state at one key. */
function valuesMeet(a, b) {
  return model.valuesMeet(a, b);
}

/** One key of a complete thing against a pattern: an omitted key is absent. */
function valuesMatchClosed(inst, patt) {
  return model.valuesMatchClosed(inst, patt);
}

/**
 * Tagged URN implementation with flat, ordered tags and configurable prefix
 */
class TaggedUrn {
  /**
   * Create a tagged URN from a prefix and its tags. The prefix and every key
   * must be identifiers (an ASCII letter, then ASCII letters, digits and `-`)
   * and are lowered; every constraint must be one a URN can write.
   * @param {string} prefix - The prefix for this URN
   * @param {Object<string, {kind: string, value?: string}>} tags - Each key's constraint
   */
  constructor(prefix, tags = {}) {
    this.prefix = identifier('prefix', prefix);
    this.tags = {};
    for (const [k, constraint] of Object.entries(tags)) {
      const key = identifier('key', k);
      if (Object.prototype.hasOwnProperty.call(this.tags, key)) {
        throw new TaggedUrnError(ErrorCodes.DUPLICATE_KEY, `Duplicate tag key: ${key}`);
      }
      this.tags[key] = checkedConstraint(key, constraint);
    }
    // The same URN on the proved model's side: its tags with the proof that
    // their keys are strictly increasing. Every semantic question is asked of
    // it. Made here, from the same tags, and the URN is frozen, so the two can
    // never describe different URNs; it is not enumerable, so it is not part
    // of what a URN serializes or compares as.
    const formal = model.make(this.prefix, this.modelTags());
    if (formal === null) {
      throw new Error(`tagged-urn: the model refused ${this.prefix}:${Object.keys(this.tags).join(';')}, whose keys are sorted`);
    }
    Object.defineProperty(this, 'formal', { value: formal, enumerable: false });
    Object.freeze(this.tags);
    Object.freeze(this);
  }

  /**
   * The tags as the model's `make` takes them: (key, constraint) pairs in
   * code-point order. Every program generated for JavaScript runs in a
   * WebAssembly instance of its own and cannot take this URN's model value,
   * so a program built on tagged-urn's model makes its own from these, with
   * its own `make`.
   * @returns {Array<[string, {kind: string, value?: string}]>}
   */
  modelTags() {
    return Object.keys(this.tags)
      .sort(compareCodePoints)
      .map((key) => [key, this.tags[key]]);
  }

  /**
   * A value as a tag writes it: bare, or quoted when it must be to read back
   * as itself.
   *
   * @param {string} value
   * @returns {string}
   */
  static writeValue(value) {
    return writeValue(value);
  }

  /**
   * Create a Tagged URN from string representation
   * Format: prefix:key1=value1;key2=value2;... or prefix:key1="value with spaces";key2=simple
   *
   * Case handling:
   * - Prefix: Normalized to lowercase
   * - Keys: Always normalized to lowercase
   * - Unquoted values: Normalized to lowercase
   * - Quoted values: Case preserved exactly as specified
   *
   * @param {string} s - The Tagged URN string
   * @returns {TaggedUrn} The parsed Tagged URN
   * @throws {TaggedUrnError} If parsing fails
   */
  static fromString(s) {
    if (!s || typeof s !== 'string') {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'Tagged URN cannot be empty');
    }

    // Fail hard on leading/trailing whitespace
    if (s !== s.trim()) {
      throw new TaggedUrnError(ErrorCodes.WHITESPACE_IN_INPUT, `Tagged URN has leading or trailing whitespace: '${s}'`);
    }

    // Find the prefix (everything before the first colon)
    const colonPos = s.indexOf(':');
    if (colonPos === -1) {
      throw new TaggedUrnError(ErrorCodes.MISSING_PREFIX, "Tagged URN must have a prefix followed by ':'");
    }

    if (colonPos === 0) {
      throw new TaggedUrnError(ErrorCodes.EMPTY_PREFIX, 'Tagged URN prefix cannot be empty');
    }

    const prefix = identifier('prefix', s.slice(0, colonPos));
    const tagsPart = s.slice(colonPos + 1);
    const tags = {};

    // Handle empty tagged URN (prefix: with no tags or just semicolon)
    if (tagsPart === '' || tagsPart === ';') {
      return new TaggedUrn(prefix, tags);
    }

    let state = ParseState.EXPECTING_KEY;
    let currentKey = '';
    let currentValue = '';
    // qualifier: null | '?' | '!' for the tag currently being parsed.
    let qualifier = null;
    const chars = [...tagsPart];
    let pos = 0;

    const finishTag = (constraint) => {
      if (Object.prototype.hasOwnProperty.call(tags, currentKey)) {
        throw new TaggedUrnError(ErrorCodes.DUPLICATE_KEY, `Duplicate tag key: ${currentKey}`);
      }
      tags[currentKey] = constraint;
      currentKey = '';
      currentValue = '';
      qualifier = null;
    };

    while (pos < chars.length) {
      const c = chars[pos];

      switch (state) {
        case ParseState.EXPECTING_KEY:
          if (c === ';') {
            pos++;
            continue;
          } else if (c === '?') {
            qualifier = '?';
            state = ParseState.AFTER_PREFIX_QUESTION;
          } else if (c === '!') {
            qualifier = '!';
            state = ParseState.AFTER_PREFIX_BANG;
          } else if (isIdentifierStart(c)) {
            currentKey += c.toLowerCase();
            state = ParseState.IN_KEY;
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `invalid character '${c}' at position ${pos}`);
          }
          break;

        case ParseState.AFTER_PREFIX_QUESTION:
        case ParseState.AFTER_PREFIX_BANG:
          if (isIdentifierStart(c)) {
            currentKey += c.toLowerCase();
            state = ParseState.IN_KEY;
          } else {
            throw new TaggedUrnError(
              ErrorCodes.INVALID_CHARACTER,
              `expected key character after '${qualifier}' qualifier, got '${c}' at position ${pos}`
            );
          }
          break;

        case ParseState.IN_KEY:
          if (c === '=') {
            state = ParseState.EXPECTING_VALUE;
          } else if (c === '?') {
            if (qualifier !== null) {
              throw new TaggedUrnError(
                ErrorCodes.INVALID_CHARACTER,
                `duplicate qualifier '?' at position ${pos}: prefix and infix qualifiers cannot be combined on key '${currentKey}'`
              );
            }
            qualifier = '?';
            state = ParseState.IN_KEY_AFTER_QUESTION;
          } else if (c === '!') {
            if (qualifier !== null) {
              throw new TaggedUrnError(
                ErrorCodes.INVALID_CHARACTER,
                `duplicate qualifier '!' at position ${pos}: prefix and infix qualifiers cannot be combined on key '${currentKey}'`
              );
            }
            qualifier = '!';
            state = ParseState.IN_KEY_AFTER_BANG;
          } else if (c === ';') {
            finishTag(canonicalNoValue(qualifier));
            state = ParseState.EXPECTING_KEY;
          } else if (isValidKeyChar(c)) {
            currentKey += c.toLowerCase();
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `invalid character '${c}' in key at position ${pos}`);
          }
          break;

        case ParseState.IN_KEY_AFTER_QUESTION:
        case ParseState.IN_KEY_AFTER_BANG:
          if (c === '=') {
            state = ParseState.EXPECTING_VALUE;
          } else if (c === ';') {
            finishTag(canonicalNoValue(qualifier));
            state = ParseState.EXPECTING_KEY;
          } else {
            throw new TaggedUrnError(
              ErrorCodes.INVALID_CHARACTER,
              `expected '=' or ';' after '${currentKey}${qualifier}' suffix qualifier, got '${c}' at position ${pos}`
            );
          }
          break;

        case ParseState.EXPECTING_VALUE:
          if (c === '"') {
            state = ParseState.IN_QUOTED_VALUE;
          } else if (c === ';') {
            throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${currentKey}'`);
          } else if (isValidUnquotedValueChar(c)) {
            currentValue += asciiLower(c);
            state = ParseState.IN_UNQUOTED_VALUE;
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `invalid character '${c}' in value at position ${pos}`);
          }
          break;

        case ParseState.IN_UNQUOTED_VALUE:
          if (c === ';') {
            finishTag(canonicalizeValue(qualifier, false, currentKey, currentValue));
            state = ParseState.EXPECTING_KEY;
          } else if (isValidUnquotedValueChar(c)) {
            currentValue += asciiLower(c);
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `invalid character '${c}' in unquoted value at position ${pos}`);
          }
          break;

        case ParseState.IN_QUOTED_VALUE:
          if (c === '"') {
            state = ParseState.EXPECTING_SEMI_OR_END;
          } else if (c === '\\') {
            state = ParseState.IN_QUOTED_VALUE_ESCAPE;
          } else {
            currentValue += c;
          }
          break;

        case ParseState.IN_QUOTED_VALUE_ESCAPE:
          if (c === '"' || c === '\\') {
            currentValue += c;
            state = ParseState.IN_QUOTED_VALUE;
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_ESCAPE_SEQUENCE, `invalid escape sequence at position ${pos} (only \\" and \\\\ allowed)`);
          }
          break;

        case ParseState.EXPECTING_SEMI_OR_END:
          if (c === ';') {
            finishTag(canonicalizeValue(qualifier, true, currentKey, currentValue));
            state = ParseState.EXPECTING_KEY;
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `expected ';' or end after quoted value, got '${c}' at position ${pos}`);
          }
          break;
      }

      pos++;
    }

    switch (state) {
      case ParseState.IN_UNQUOTED_VALUE:
        finishTag(canonicalizeValue(qualifier, false, currentKey, currentValue));
        break;
      case ParseState.EXPECTING_SEMI_OR_END:
        finishTag(canonicalizeValue(qualifier, true, currentKey, currentValue));
        break;
      case ParseState.EXPECTING_KEY:
        break;
      case ParseState.IN_QUOTED_VALUE:
      case ParseState.IN_QUOTED_VALUE_ESCAPE:
        throw new TaggedUrnError(ErrorCodes.UNTERMINATED_QUOTE, `unterminated quote at position ${pos}`);
      case ParseState.AFTER_PREFIX_QUESTION:
      case ParseState.AFTER_PREFIX_BANG:
        throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `qualifier '${qualifier}' at end of input has no key`);
      case ParseState.IN_KEY:
      case ParseState.IN_KEY_AFTER_QUESTION:
      case ParseState.IN_KEY_AFTER_BANG:
        finishTag(canonicalNoValue(qualifier));
        break;
      case ParseState.EXPECTING_VALUE:
        throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${currentKey}'`);
    }

    return new TaggedUrn(prefix, tags);
  }

  /**
   * Create an empty Tagged URN with the specified prefix (required)
   * @param {string} prefix - The prefix to use
   * @returns {TaggedUrn} An empty TaggedUrn instance
   */
  static empty(prefix) {
    return new TaggedUrn(prefix, {});
  }

  /**
   * Parse a URN string and return its canonical form.
   *
   * @param {string} urnStr - The URN string to canonicalize
   * @returns {string} The canonical string representation
   * @throws {TaggedUrnError} If parsing fails
   */
  static canonical(urnStr) {
    return TaggedUrn.fromString(urnStr).toString();
  }

  /**
   * Parse a URN string and return its canonical form, or null if input is null/undefined.
   *
   * @param {string|null|undefined} urnStr - The URN string to canonicalize
   * @returns {string|null} The canonical string representation, or null
   * @throws {TaggedUrnError} If parsing fails (for non-null input)
   */
  static canonicalOption(urnStr) {
    if (urnStr === null || urnStr === undefined) return null;
    return TaggedUrn.fromString(urnStr).toString();
  }

  /**
   * Get the prefix of this tagged URN
   * @returns {string} The prefix
   */
  getPrefix() {
    return this.prefix;
  }

  /**
   * The canonical string representation: the prefix, `:`, and the tags in key
   * order joined by `;`, with no trailing semicolon. Each constraint is
   * written in its canonical form:
   *
   *   present        -> k
   *   unconstrained  -> ?k
   *   absent         -> !k
   *   optionalNot v  -> k?=v
   *   presentNot v   -> k!=v
   *   exact v        -> k=v
   *
   * A value is quoted only when it must be to read back as itself: exact `*`
   * prints `k="*"`.
   *
   * @returns {string} The canonical string representation
   */
  toString() {
    const tagParts = Object.keys(this.tags).sort(compareCodePoints).map((key) => {
      const c = this.tags[key];
      switch (c.kind) {
        case 'present': return key;
        case 'unconstrained': return `?${key}`;
        case 'absent': return `!${key}`;
        case 'optionalNot': return `${key}?=${writeValue(c.value)}`;
        case 'presentNot': return `${key}!=${writeValue(c.value)}`;
        case 'exact': return `${key}=${writeValue(c.value)}`;
        default: throw new Error(`tagged-urn: stored constraint ${JSON.stringify(c)}`);
      }
    });
    return `${this.prefix}:${tagParts.join(';')}`;
  }

  /**
   * The constraint the URN writes for `key`, or undefined when it does not
   * mention it. Key is normalized to lowercase for lookup.
   *
   * @param {string} key - The tag key
   * @returns {{kind: string, value?: string}|undefined}
   */
  getTag(key) {
    return this.tags[key.toLowerCase()];
  }

  /**
   * The constraint the URN writes for `key`, `missing` when it does not
   * mention it: the model's form of the key.
   *
   * @param {string} key - The tag key
   * @returns {{kind: string, value?: string}}
   */
  constraint(key) {
    const c = this.tags[key.toLowerCase()];
    return c === undefined ? Constraint.missing() : c;
  }

  /**
   * Whether this URN writes the exact value `value` for `key` (`key=value`).
   * Key is normalized to lowercase; value comparison is case-sensitive.
   *
   * @param {string} key - The tag key
   * @param {string} value - The exact value
   * @returns {boolean}
   */
  hasTag(key, value) {
    return Constraint.equals(this.tags[key.toLowerCase()], Constraint.exact(value));
  }

  /**
   * Whether `tagName` is present as a marker (`present`, written as just the
   * key). Example: cap:constrained;... has marker tag "constrained".
   *
   * @param {string} tagName - The marker key
   * @returns {boolean}
   */
  hasMarkerTag(tagName) {
    const c = this.tags[tagName.toLowerCase()];
    return c !== undefined && c.kind === 'present';
  }

  /**
   * A new tagged URN with an added or replaced tag. The key must be an
   * identifier and is lowered; the constraint must be one a URN can write.
   *
   * @param {string} key - The tag key
   * @param {{kind: string, value?: string}} constraint - The tag's constraint
   * @returns {TaggedUrn}
   */
  withTag(key, constraint) {
    const k = identifier('key', key);
    const newTags = { ...this.tags };
    newTags[k] = checkedConstraint(k, constraint);
    return new TaggedUrn(this.prefix, newTags);
  }

  /**
   * Create a new tagged URN with a tag removed
   * Key is normalized to lowercase for case-insensitive removal
   *
   * @param {string} key - The tag key to remove
   * @returns {TaggedUrn} A new TaggedUrn instance with the tag removed
   */
  withoutTag(key) {
    const newTags = { ...this.tags };
    delete newTags[key.toLowerCase()];
    return new TaggedUrn(this.prefix, newTags);
  }

  /**
   * Check if this URN (instance) satisfies the pattern's constraints.
   * Equivalent to pattern.accepts(this).
   *
   * IMPORTANT: Both URNs must have the same prefix. Comparing URNs with
   * different prefixes is a programming error and will throw an error.
   *
   * @param {TaggedUrn} pattern - The pattern URN to match against
   * @returns {boolean} Whether this instance conforms to the pattern
   * @throws {TaggedUrnError} If prefixes don't match
   */
  conformsTo(pattern) {
    if (!pattern) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot match against null pattern');
    }
    return TaggedUrn._checkMatch(this, pattern);
  }

  /**
   * Check if this URN (pattern) accepts the given instance.
   * Equivalent to instance.conformsTo(this).
   *
   * @param {TaggedUrn} instance - The instance URN to test
   * @returns {boolean} Whether the pattern accepts the instance
   * @throws {TaggedUrnError} If prefixes don't match
   */
  accepts(instance) {
    if (!instance) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot match against null instance');
    }
    return TaggedUrn._checkMatch(instance, this);
  }

  /**
   * Whether this URN and `other` COULD be about the same thing: some thing is
   * described by both. Symmetric — neither is the instance.
   *
   * `conformsTo` is a guarantee: everything this URN describes, the pattern
   * describes. This is the other question the same meanings answer, and the one
   * a search asks: `media:ext` (some ext) does not conform to `media:document;ext=pdf`,
   * and is not excluded by it either — it meets it. Whatever conforms meets;
   * what meets need not conform, and meeting is not transitive (a pdf meets
   * "some ext", which meets a png). Decided by the model.
   *
   * @param {TaggedUrn} other
   * @returns {boolean}
   * @throws {TaggedUrnError} If prefixes don't match
   */
  meets(other) {
    if (!other) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot compare with a null URN');
    }
    TaggedUrn._samePrefix(this, other);
    return model.meets(this.formal, other.formal);
  }

  /**
   * Whether this URN, read as a COMPLETE thing, satisfies `pattern`.
   *
   * A description that omits a key says nothing about it, which is how
   * `conformsTo` reads both sides. A thing that exists — a value with these
   * tags, a cap's own list of tags — omits a key because it does not have it.
   * Read so, a thing that does not mention `x` satisfies `!x`. Use this where
   * the receiver is what something IS; use `conformsTo` where it is what
   * something is declared to take or give. Decided by the model.
   *
   * @param {TaggedUrn} pattern
   * @returns {boolean}
   * @throws {TaggedUrnError} If prefixes don't match
   */
  satisfies(pattern) {
    if (!pattern) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot match against null pattern');
    }
    TaggedUrn._samePrefix(this, pattern);
    return model.refinesClosed(this.formal, pattern.formal);
  }

  /**
   * Whether this URN, read as a complete thing, COULD satisfy `pattern`:
   * `satisfies` is to this as `conformsTo` is to `meets`.
   *
   * @param {TaggedUrn} pattern
   * @returns {boolean}
   * @throws {TaggedUrnError} If prefixes don't match
   */
  maySatisfy(pattern) {
    if (!pattern) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot match against null pattern');
    }
    TaggedUrn._samePrefix(this, pattern);
    return model.meetsClosed(this.formal, pattern.formal);
  }

  /**
   * Check if this URN (instance) satisfies the pattern string's constraints.
   * Parses the pattern string then calls conformsTo().
   *
   * @param {string} patternStr - The pattern URN string to match against
   * @returns {boolean} Whether this instance conforms to the pattern
   * @throws {TaggedUrnError} If parsing fails or prefixes don't match
   */
  conformsToStr(patternStr) {
    const pattern = TaggedUrn.fromString(patternStr);
    return this.conformsTo(pattern);
  }

  /**
   * Check if this URN (pattern) accepts the given instance string.
   * Parses the instance string then calls accepts().
   *
   * @param {string} instanceStr - The instance URN string to test
   * @returns {boolean} Whether the pattern accepts the instance
   * @throws {TaggedUrnError} If parsing fails or prefixes don't match
   */
  acceptsStr(instanceStr) {
    const instance = TaggedUrn.fromString(instanceStr);
    return this.accepts(instance);
  }

  /**
   * Core matching: does instance satisfy pattern's constraints?
   * @private
   */
  static _checkMatch(instance, pattern) {
    TaggedUrn._samePrefix(instance, pattern);
    return model.refines(instance.formal, pattern.formal);
  }

  /**
   * The most specific URN every one of `urns` conforms to: their common
   * denominator.
   *
   * Key by key, the bound allows every state some input allows. Where no single
   * form says exactly that, there is no least bound at all — `ext=png` and
   * `ext=jpeg` are both `ext`, both `ext!=pdf` and both `ext!=gif` — so the
   * bound is the least among those that exclude only values the inputs name:
   * here `ext`. When one input holds all the others, the bound is that input.
   * The bound of no URNs is the URN with no tags.
   *
   * Made by the model (`TaggedUrn.Exec.leastUpperBound`), whose theorems say
   * every input conforms to the bound, the bound conforms to every such bound
   * of them, and no tag of it is `missing`.
   *
   * @param {string} prefix - The prefix every URN must have; an identifier
   * @param {TaggedUrn[]} urns - The URNs to bound
   * @returns {TaggedUrn} The bound
   * @throws {TaggedUrnError} PREFIX_MISMATCH if a URN has another prefix
   */
  static leastUpperBound(prefix, urns) {
    const lower = identifier('prefix', prefix);
    const tags = model.leastUpperBound(lower, urns.map((u) => u.formal));
    if (tags === null) {
      const other = urns.find((u) => u.prefix !== lower);
      if (other === undefined) {
        throw new Error(`tagged-urn: the model made no bound of URNs that all have the prefix ${lower}`);
      }
      throw new TaggedUrnError(
        ErrorCodes.PREFIX_MISMATCH,
        `Cannot bound URNs with different prefixes: '${lower}' vs '${other.prefix}'`
      );
    }
    return new TaggedUrn(lower, Object.fromEntries(tags));
  }

  /**
   * Refuse a comparison of URNs with different prefixes: the model folds the
   * prefix into its answer, but comparing across prefixes is a caller's error.
   * @private
   */
  static _samePrefix(a, b) {
    if (a.prefix !== b.prefix) {
      throw new TaggedUrnError(
        ErrorCodes.PREFIX_MISMATCH,
        `Cannot compare URNs with different prefixes: '${a.prefix}' vs '${b.prefix}'`
      );
    }
  }

  /**
   * Calculate specificity score for URN matching, as the model computes it:
   * the sum of per-tag truth-table scores. Per-tag ladder:
   *
   *   unconstrained  -> 0   (no constraint)
   *   optionalNot    -> 1   (absent or not v)
   *   present        -> 2   (must-have-any)
   *   presentNot     -> 3   (present and not v)
   *   exact          -> 4   (exact match)
   *   absent         -> 5   (must-not-have)
   *
   * @returns {number} The specificity score
   */
  specificity() {
    return Number(model.specificity(this.formal));
  }

  /**
   * How many tags fall into each non-zero form, from the highest score to the
   * lowest: [absent, exact, presentNot, present, optionalNot].
   * @returns {number[]}
   */
  specificityTuple() {
    const order = ['absent', 'exact', 'presentNot', 'present', 'optionalNot'];
    const counts = [0, 0, 0, 0, 0];
    for (const c of Object.values(this.tags)) {
      const i = order.indexOf(c.kind);
      if (i >= 0) counts[i]++;
    }
    return counts;
  }

  /**
   * Check if this URN is more specific than another
   *
   * @param {TaggedUrn} other - The other URN to compare with
   * @returns {boolean} Whether this URN is more specific
   * @throws {TaggedUrnError} If prefixes don't match
   */
  isMoreSpecificThan(other) {
    if (!other) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot compare against null URN');
    }

    // First check prefix
    if (this.prefix !== other.prefix) {
      throw new TaggedUrnError(
        ErrorCodes.PREFIX_MISMATCH,
        `Cannot compare URNs with different prefixes: '${this.prefix}' vs '${other.prefix}'`
      );
    }

    return this.specificity() > other.specificity();
  }

  /**
   * Check if two URNs are equivalent (identical tag sets), as the model
   * decides it: a.isEquivalent(b) ≡ a.accepts(b) && b.accepts(a)
   */
  isEquivalent(other) {
    if (!other) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot compare against null URN');
    }
    TaggedUrn._samePrefix(this, other);
    return model.equivalent(this.formal, other.formal);
  }

  /**
   * Check if two URNs are comparable (one is a specialization of the other),
   * as the model decides it: a.isComparable(b) ≡ a.accepts(b) || b.accepts(a)
   */
  isComparable(other) {
    if (!other) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot compare against null URN');
    }
    TaggedUrn._samePrefix(this, other);
    return model.comparable(this.formal, other.formal);
  }

  /**
   * String variant of isEquivalent
   */
  isEquivalentStr(otherStr) {
    const other = TaggedUrn.fromString(otherStr);
    return this.isEquivalent(other);
  }

  /**
   * String variant of isComparable
   */
  isComparableStr(otherStr) {
    const other = TaggedUrn.fromString(otherStr);
    return this.isComparable(other);
  }

  /**
   * Compute the coordinate-space delta from `base` to `this`.
   *
   * Delta is defined over explicit canonical coordinates, not semantic
   * equivalence classes. Equivalent URNs may still yield a non-empty delta if
   * one side explicitly authors no-op coordinates.
   *
   * @param {TaggedUrn} base
   * @returns {TaggedUrnCoordinateDelta}
   * @throws {TaggedUrnError} If prefixes do not match
   */
  deltaFrom(base) {
    if (!base) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot derive delta from null URN');
    }
    if (this.prefix !== base.prefix) {
      throw new TaggedUrnError(
        ErrorCodes.PREFIX_MISMATCH,
        `Cannot compare URNs with different prefixes: '${base.prefix}' vs '${this.prefix}'`
      );
    }

    const relationKind = this.isEquivalent(base)
      ? TaggedUrnRelationKind.EQUIVALENT
      : (this.isComparable(base)
        ? TaggedUrnRelationKind.COMPARABLE
        : TaggedUrnRelationKind.INCOMPARABLE);

    const removed = {};
    const added = {};
    const allKeys = new Set([
      ...Object.keys(base.tags),
      ...Object.keys(this.tags),
    ]);

    for (const key of allKeys) {
      const baseValue = Object.prototype.hasOwnProperty.call(base.tags, key)
        ? base.tags[key]
        : undefined;
      const targetValue = Object.prototype.hasOwnProperty.call(this.tags, key)
        ? this.tags[key]
        : undefined;
      if (baseValue === targetValue || Constraint.equals(baseValue, targetValue)) {
        continue;
      }
      if (baseValue !== undefined) {
        removed[key] = baseValue;
      }
      if (targetValue !== undefined) {
        added[key] = targetValue;
      }
    }

    return new TaggedUrnCoordinateDelta(this.prefix, removed, added, relationKind);
  }

  /**
   * Apply a coordinate-space delta to this tagged URN.
   *
   * Keys named in `removed` are deleted regardless of their current value,
   * then keys named in `added` are inserted, each checked as `withTag` checks.
   * Unrelated coordinates are preserved.
   *
   * @param {TaggedUrnCoordinateDelta} delta
   * @returns {TaggedUrn}
   * @throws {TaggedUrnError} If prefixes do not match
   */
  applyDelta(delta) {
    if (!delta) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot apply null delta');
    }
    if (this.prefix !== delta.prefix) {
      throw new TaggedUrnError(
        ErrorCodes.PREFIX_MISMATCH,
        `Cannot apply delta with different prefix: '${delta.prefix}' vs '${this.prefix}'`
      );
    }

    const nextTags = { ...this.tags };
    for (const key of Object.keys(delta.removed)) {
      delete nextTags[key];
    }
    for (const [key, value] of Object.entries(delta.added)) {
      nextTags[key] = value;
    }
    return new TaggedUrn(this.prefix, nextTags);
  }

  /**
   * The same URN with `key`, where it has it, made a marker (`present`).
   *
   * @param {string} key - The tag key
   * @returns {TaggedUrn}
   */
  withWildcardTag(key) {
    if (Object.prototype.hasOwnProperty.call(this.tags, key.toLowerCase())) {
      return this.withTag(key, Constraint.present());
    }
    return this;
  }

  /**
   * Create a new URN with only specified tags
   *
   * @param {string[]} keys - Array of tag keys to include
   * @returns {TaggedUrn} A new TaggedUrn instance with only the specified tags
   */
  subset(keys) {
    const newTags = {};
    for (const key of keys) {
      const normalizedKey = key.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(this.tags, normalizedKey)) {
        newTags[normalizedKey] = this.tags[normalizedKey];
      }
    }
    return new TaggedUrn(this.prefix, newTags);
  }

  /**
   * Merge with another URN (other takes precedence for conflicts)
   * Both must have the same prefix
   *
   * @param {TaggedUrn} other - The URN to merge with
   * @returns {TaggedUrn} A new TaggedUrn instance with merged tags
   * @throws {TaggedUrnError} If prefixes don't match
   */
  merge(other) {
    if (!other) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot merge with null URN');
    }

    if (this.prefix !== other.prefix) {
      throw new TaggedUrnError(
        ErrorCodes.PREFIX_MISMATCH,
        `Cannot merge URNs with different prefixes: '${this.prefix}' vs '${other.prefix}'`
      );
    }

    const newTags = { ...this.tags };
    Object.assign(newTags, other.tags);
    return new TaggedUrn(this.prefix, newTags);
  }

  /**
   * Check if this tagged URN is equal to another
   *
   * @param {TaggedUrn} other - The other tagged URN to compare with
   * @returns {boolean} Whether the tagged URNs are equal
   */
  equals(other) {
    if (!other || !(other instanceof TaggedUrn)) {
      return false;
    }

    if (this.prefix !== other.prefix) {
      return false;
    }

    const thisKeys = Object.keys(this.tags).sort();
    const otherKeys = Object.keys(other.tags).sort();

    if (thisKeys.length !== otherKeys.length) {
      return false;
    }

    for (let i = 0; i < thisKeys.length; i++) {
      if (thisKeys[i] !== otherKeys[i]) {
        return false;
      }
      if (!Constraint.equals(this.tags[thisKeys[i]], other.tags[otherKeys[i]])) {
        return false;
      }
    }

    return true;
  }

  /**
   * The order of URNs: by their parts, never their text. The prefix, then the
   * tags in key order, each by its key, then by its constraint's form in the
   * truth table's order (unconstrained, optionalNot, present, presentNot,
   * exact, absent), then by its value; a URN whose tags are the beginning of
   * another's stands first. Keys and values are ordered by code point. The
   * text would order `file;sample` after `file-path`, wherever one key is the
   * beginning of another.
   *
   * @param {TaggedUrn} other
   * @returns {number} Negative, zero or positive as this stands before, with or after other
   */
  compare(other) {
    const byPrefix = compareCodePoints(this.prefix, other.prefix);
    if (byPrefix !== 0) return byPrefix;
    const keysA = Object.keys(this.tags).sort(compareCodePoints);
    const keysB = Object.keys(other.tags).sort(compareCodePoints);
    for (let i = 0; i < Math.min(keysA.length, keysB.length); i++) {
      const byKey = compareCodePoints(keysA[i], keysB[i]);
      if (byKey !== 0) return byKey;
      const a = this.tags[keysA[i]];
      const b = other.tags[keysB[i]];
      const byForm = formOrder(a) - formOrder(b);
      if (byForm !== 0) return byForm;
      const byValue = compareCodePoints(a.value ?? '', b.value ?? '');
      if (byValue !== 0) return byValue;
    }
    return keysA.length - keysB.length;
  }

  /**
   * Get a hash string for this tagged URN
   * Two equivalent tagged URNs will have the same hash
   *
   * @returns {string} A hash of the canonical string representation
   */
  hash() {
    // Simple hash function for the canonical string
    const canonical = this.toString();
    let hash = 0;
    for (let i = 0; i < canonical.length; i++) {
      const char = canonical.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

/**
 * Tagged URN Builder for fluent construction
 */
class TaggedUrnBuilder {
  /**
   * Create a new builder with a specified prefix (required), which must be an
   * identifier and is lowered.
   * @param {string} prefix - The prefix to use
   */
  constructor(prefix) {
    this._prefix = identifier('prefix', prefix);
    this.tags = {};
  }

  /**
   * Add a tag of any form. The key must be an identifier and is lowered; the
   * constraint must be one a URN can write.
   *
   * @param {string} key - The tag key
   * @param {{kind: string, value?: string}} constraint - The tag's constraint
   * @returns {TaggedUrnBuilder} This builder instance for chaining
   */
  constraint(key, constraint) {
    const k = identifier('key', key);
    if (Object.prototype.hasOwnProperty.call(this.tags, k)) {
      throw new TaggedUrnError(ErrorCodes.DUPLICATE_KEY, `Duplicate tag key: ${k}`);
    }
    this.tags[k] = checkedConstraint(k, constraint);
    return this;
  }

  /**
   * Add the exact value `value` for `key` (`key=value`), taken literally:
   * tag('x', '*') is the exact value `*`, not the marker.
   *
   * @param {string} key - The tag key
   * @param {string} value - The exact value
   * @returns {TaggedUrnBuilder} This builder instance for chaining
   */
  tag(key, value) {
    return this.constraint(key, Constraint.exact(value));
  }

  /**
   * Add `key` as a marker (`present`, written as just the key).
   * @param {string} key - The tag key
   * @returns {TaggedUrnBuilder} This builder for chaining
   */
  marker(key) {
    return this.constraint(key, Constraint.present());
  }

  /**
   * Build the final TaggedUrn
   *
   * @returns {TaggedUrn} A new TaggedUrn instance
   * @throws {TaggedUrnError} If no tags have been added
   */
  build() {
    if (Object.keys(this.tags).length === 0) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'Tagged URN cannot be empty');
    }
    return new TaggedUrn(this._prefix, this.tags);
  }

  /**
   * Build the final TaggedUrn, allowing empty tags
   *
   * @returns {TaggedUrn} A new TaggedUrn instance
   */
  buildAllowEmpty() {
    return new TaggedUrn(this._prefix, this.tags);
  }
}

/**
 * URN Matcher utility class
 */
class UrnMatcher {
  /**
   * Find the most specific URN that conforms to a request's constraints.
   * URNs are instances (capabilities), request is the pattern (requirement).
   *
   * @param {TaggedUrn[]} urns - Array of available URNs
   * @param {TaggedUrn} request - The request to match
   * @returns {TaggedUrn|null} The best matching URN or null if no match
   * @throws {TaggedUrnError} If prefixes don't match
   */
  static findBestMatch(urns, request) {
    let best = null;
    let bestSpecificity = -1;

    for (const urn of urns) {
      if (urn.conformsTo(request)) {
        const specificity = urn.specificity();
        if (specificity > bestSpecificity) {
          best = urn;
          bestSpecificity = specificity;
        }
      }
    }

    return best;
  }

  /**
   * Find all URNs that conform to a request's constraints, sorted by specificity.
   * URNs are instances (capabilities), request is the pattern (requirement).
   *
   * @param {TaggedUrn[]} urns - Array of available URNs
   * @param {TaggedUrn} request - The request to match
   * @returns {TaggedUrn[]} Array of matching URNs sorted by specificity (most specific first)
   * @throws {TaggedUrnError} If prefixes don't match
   */
  static findAllMatches(urns, request) {
    const results = [];
    for (const urn of urns) {
      if (urn.conformsTo(request)) {
        results.push(urn);
      }
    }

    // Sort by specificity (most specific first)
    results.sort((a, b) => b.specificity() - a.specificity());

    return results;
  }

  /**
   * Check if two URN sets are compatible
   * All URNs in both sets must have the same prefix
   *
   * @param {TaggedUrn[]} urns1 - First set of URNs
   * @param {TaggedUrn[]} urns2 - Second set of URNs
   * @returns {boolean} Whether any URNs from the two sets are compatible
   * @throws {TaggedUrnError} If prefixes don't match
   */
  static areCompatible(urns1, urns2) {
    for (const u1 of urns1) {
      for (const u2 of urns2) {
        if (u1.accepts(u2) || u2.accepts(u1)) {
          return true;
        }
      }
    }
    return false;
  }
}

export {
  TaggedUrn,
  TaggedUrnCoordinateDelta,
  TaggedUrnRelationKind,
  TaggedUrnBuilder,
  UrnMatcher,
  TaggedUrnError,
  ErrorCodes,
  Constraint,
  valuesMatch,
  valuesMeet,
  valuesMatchClosed
};
