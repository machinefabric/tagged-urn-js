// Tagged URN JavaScript Implementation
// Follows the exact same rules as Rust, Go, and Objective-C implementations

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

// Error codes
const ErrorCodes = {
  INVALID_FORMAT: 1,
  EMPTY_TAG: 2,
  INVALID_CHARACTER: 3,
  INVALID_TAG_FORMAT: 4,
  MISSING_PREFIX: 5,
  DUPLICATE_KEY: 6,
  NUMERIC_KEY: 7,
  UNTERMINATED_QUOTE: 8,
  INVALID_ESCAPE_SEQUENCE: 9,
  EMPTY_PREFIX: 10,
  PREFIX_MISMATCH: 11,
  WHITESPACE_IN_INPUT: 12
};

// Parser states for state machine.
//
// The parser handles six tag forms — the canonical alphabet of the
// constraint truth table:
//
//   | Authored                | Canonical | Stored value | Score | Reading                                  |
//   |-------------------------|-----------|--------------|------:|------------------------------------------|
//   | `?x` ≡ `x?`             | `?x`      | "?"          |     0 | no constraint                            |
//   | `?x=v` ≡ `x?=v`         | `x?=v`    | "?=v"        |     1 | absent OR (present and not v)            |
//   | `x` ≡ `x=*`             | `x`       | "*"          |     2 | present with any value                   |
//   | `!x=v` ≡ `x!=v`         | `x!=v`    | "!=v"        |     3 | present and not v                        |
//   | `x=v`                   | `x=v`     | "v"          |     4 | present and exactly v (`v ∉ {?, !, *}`)  |
//   | `!x` ≡ `x!`             | `!x`      | "!"          |     5 | absent (must-not-have)                   |
//
// Disallowed (hard parse errors): `?x?`, `?x?=v`, `!x!=v`, `?!x`,
// `!?x`, `?x=*`, `!x=*`, mixed prefix+infix.
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

/**
 * Check if a character is valid for a key
 */
function isValidKeyChar(c) {
  return /[a-zA-Z0-9_\-\/:\.]/.test(c);
}

/**
 * Check if a character is valid for an unquoted value
 */
function isValidUnquotedValueChar(c) {
  return /[a-zA-Z0-9_\-\/:\.\*\?\!]/.test(c);
}

/**
 * Check if a value needs quoting for serialization
 */
function needsQuoting(value) {
  for (const c of value) {
    if (c === ';' || c === '=' || c === '"' || c === '\\' || c === ' ' || c.toUpperCase() !== c.toLowerCase() && c === c.toUpperCase()) {
      return true;
    }
  }
  return false;
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

// Form classification — six canonical forms plus Missing.
const Form = {
  MISSING: 0,
  NO_CONSTRAINT: 1,        // "?"
  ABSENT_OR_NOT_VALUE: 2,  // "?=v"
  MUST_HAVE_ANY: 3,        // "*"
  PRESENT_NOT_VALUE: 4,    // "!=v"
  EXACT: 5,
  MUST_NOT_HAVE: 6,        // "!"
};

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

// Classify a stored value. Returns { kind, raw } — raw is the inner
// v for ?=v and !=v, the literal value for exact, and '' otherwise.
function classifyForm(value) {
  if (value === undefined) return { kind: Form.MISSING, raw: '' };
  if (value === '?') return { kind: Form.NO_CONSTRAINT, raw: '' };
  if (value === '*') return { kind: Form.MUST_HAVE_ANY, raw: '' };
  if (value === '!') return { kind: Form.MUST_NOT_HAVE, raw: '' };
  if (value.startsWith('?=')) return { kind: Form.ABSENT_OR_NOT_VALUE, raw: value.slice(2) };
  if (value.startsWith('!=')) return { kind: Form.PRESENT_NOT_VALUE, raw: value.slice(2) };
  return { kind: Form.EXACT, raw: value };
}

/**
 * Per-tag truth-table specificity score. Applied uniformly to any
 * stored tag value. Missing keys score 0; the caller filters them.
 *
 *   "?"          -> 0   (no constraint)
 *   starts "?="  -> 1   (absent or not v)
 *   "*"          -> 2   (must-have-any)
 *   starts "!="  -> 3   (present and not v)
 *   "!"          -> 5   (must-not-have)
 *   otherwise    -> 4   (exact value)
 */
function scoreTagValue(value) {
  if (value === '?') return 0;
  if (value === '*') return 2;
  if (value === '!') return 5;
  if (value.startsWith('?=')) return 1;
  if (value.startsWith('!=')) return 3;
  return 4;
}

/**
 * Check if instance value matches pattern constraint, per the truth
 * table over the six canonical forms (plus Missing). See
 * capdag/docs/04-PREDICATES.md §2.5 for the cross-product table.
 */
function valuesMatch(inst, patt) {
  const i = classifyForm(inst);
  const p = classifyForm(patt);

  if (p.kind === Form.MISSING || p.kind === Form.NO_CONSTRAINT) return true;
  if (i.kind === Form.NO_CONSTRAINT) return true;

  if (p.kind === Form.MUST_NOT_HAVE) {
    return i.kind === Form.MISSING
        || i.kind === Form.MUST_NOT_HAVE
        || i.kind === Form.ABSENT_OR_NOT_VALUE;
  }

  if (p.kind === Form.MUST_HAVE_ANY) {
    return !(i.kind === Form.MISSING
          || i.kind === Form.ABSENT_OR_NOT_VALUE
          || i.kind === Form.MUST_NOT_HAVE);
  }

  if (p.kind === Form.PRESENT_NOT_VALUE) {
    if (i.kind === Form.MISSING
     || i.kind === Form.ABSENT_OR_NOT_VALUE
     || i.kind === Form.MUST_NOT_HAVE) return false;
    if (i.kind === Form.MUST_HAVE_ANY || i.kind === Form.PRESENT_NOT_VALUE) return true;
    return i.raw !== p.raw;
  }

  if (p.kind === Form.ABSENT_OR_NOT_VALUE) {
    if (i.kind === Form.MISSING
     || i.kind === Form.ABSENT_OR_NOT_VALUE
     || i.kind === Form.MUST_NOT_HAVE) return true;
    if (i.kind === Form.MUST_HAVE_ANY || i.kind === Form.PRESENT_NOT_VALUE) return true;
    return i.raw !== p.raw;
  }

  // p.kind === Form.EXACT
  if (i.kind === Form.MISSING
   || i.kind === Form.ABSENT_OR_NOT_VALUE
   || i.kind === Form.MUST_NOT_HAVE) return false;
  if (i.kind === Form.MUST_HAVE_ANY) return true;
  if (i.kind === Form.PRESENT_NOT_VALUE) return i.raw !== p.raw;
  return i.raw === p.raw;
}

/**
 * Tagged URN implementation with flat, ordered tags and configurable prefix
 */
class TaggedUrn {
  /**
   * Create a new TaggedUrn
   * @param {string} prefix - The prefix for this URN
   * @param {Object} tags - Initial tags (will not be re-normalized in constructor)
   * @param {boolean} skipNormalization - If true, skip key normalization (internal use)
   */
  constructor(prefix, tags = {}, skipNormalization = false) {
    this.prefix = prefix.toLowerCase();
    this.tags = {};
    if (skipNormalization) {
      this.tags = { ...tags };
    } else {
      for (const [key, value] of Object.entries(tags)) {
        this.tags[key.toLowerCase()] = value;
      }
    }
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

    const prefix = s.slice(0, colonPos).toLowerCase();
    const tagsPart = s.slice(colonPos + 1);
    const tags = {};

    // Handle empty tagged URN (prefix: with no tags or just semicolon)
    if (tagsPart === '' || tagsPart === ';') {
      return new TaggedUrn(prefix, tags, true);
    }

    let state = ParseState.EXPECTING_KEY;
    let currentKey = '';
    let currentValue = '';
    // qualifier: null | '?' | '!' for the tag currently being parsed.
    let qualifier = null;
    const chars = [...tagsPart];
    let pos = 0;

    const canonicalNoValue = (q) => {
      if (q === null) return '*';
      if (q === '?') return '?';
      if (q === '!') return '!';
      throw new Error(`invalid qualifier ${q}`);
    };

    const canonicalizeValue = (q, key, value) => {
      if (q === null) return value;
      if (value === '*' || value === '?' || value === '!') {
        throw new TaggedUrnError(
          ErrorCodes.INVALID_CHARACTER,
          `qualifier '${q}' on key '${key}' cannot combine with sigil value '${value}': ` +
          `use a real value or drop the qualifier`
        );
      }
      return `${q}=${value}`;
    };

    const finishTag = () => {
      if (currentKey === '') {
        throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, 'empty key');
      }
      if (currentValue === '') {
        throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${currentKey}'`);
      }
      if (tags.hasOwnProperty(currentKey)) {
        throw new TaggedUrnError(ErrorCodes.DUPLICATE_KEY, `Duplicate tag key: ${currentKey}`);
      }
      if (/^\d+$/.test(currentKey)) {
        throw new TaggedUrnError(ErrorCodes.NUMERIC_KEY, `Tag key cannot be purely numeric: ${currentKey}`);
      }

      tags[currentKey] = currentValue;
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
          } else if (isValidKeyChar(c)) {
            currentKey += c.toLowerCase();
            state = ParseState.IN_KEY;
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `invalid character '${c}' at position ${pos}`);
          }
          break;

        case ParseState.AFTER_PREFIX_QUESTION:
        case ParseState.AFTER_PREFIX_BANG:
          if (isValidKeyChar(c)) {
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
            if (currentKey === '') {
              throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, 'empty key');
            }
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
            if (currentKey === '') {
              throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, 'empty key');
            }
            currentValue = canonicalNoValue(qualifier);
            finishTag();
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
            currentValue = canonicalNoValue(qualifier);
            finishTag();
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
            currentValue += c.toLowerCase();
            state = ParseState.IN_UNQUOTED_VALUE;
          } else {
            throw new TaggedUrnError(ErrorCodes.INVALID_CHARACTER, `invalid character '${c}' in value at position ${pos}`);
          }
          break;

        case ParseState.IN_UNQUOTED_VALUE:
          if (c === ';') {
            currentValue = canonicalizeValue(qualifier, currentKey, currentValue);
            finishTag();
            state = ParseState.EXPECTING_KEY;
          } else if (isValidUnquotedValueChar(c)) {
            currentValue += c.toLowerCase();
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
            currentValue = canonicalizeValue(qualifier, currentKey, currentValue);
            finishTag();
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
      case ParseState.EXPECTING_SEMI_OR_END:
        currentValue = canonicalizeValue(qualifier, currentKey, currentValue);
        finishTag();
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
        if (currentKey === '') {
          throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, 'empty key');
        }
        currentValue = canonicalNoValue(qualifier);
        finishTag();
        break;
      case ParseState.IN_KEY_AFTER_QUESTION:
      case ParseState.IN_KEY_AFTER_BANG:
        currentValue = canonicalNoValue(qualifier);
        finishTag();
        break;
      case ParseState.EXPECTING_VALUE:
        throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${currentKey}'`);
    }

    return new TaggedUrn(prefix, tags, true);
  }

  /**
   * Create an empty Tagged URN with the specified prefix (required)
   * @param {string} prefix - The prefix to use
   * @returns {TaggedUrn} An empty TaggedUrn instance
   */
  static empty(prefix) {
    return new TaggedUrn(prefix, {}, true);
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
   * Get the canonical string representation of this tagged URN
   * Uses the stored prefix
   * Tags are sorted alphabetically for consistent representation
   * No trailing semicolon in canonical form
   * Values are quoted only when necessary (smart quoting)
   * Special value serialization:
   * - * (must-have-any): serialized as value-less tag (just the key)
   * - ? (unspecified): serialized as key=?
   * - ! (must-not-have): serialized as key=!
   *
   * @returns {string} The canonical string representation
   */
  toString() {
    if (Object.keys(this.tags).length === 0) {
      return `${this.prefix}:`;
    }

    const sortedKeys = Object.keys(this.tags).sort();

    // Build canonical serialization. Stored values map to:
    //   "*"       -> "k"      (bare key, must-have-any)
    //   "?"       -> "?k"     (prefix qualifier, no constraint)
    //   "!"       -> "!k"     (prefix qualifier, must-not-have)
    //   "?=v"     -> "k?=v"   (infix qualifier, absent or not v)
    //   "!=v"     -> "k!=v"   (infix qualifier, present and not v)
    //   exact "v" -> "k=v" / "k=\"v\"" (with quoting if needed)
    const tagParts = sortedKeys.map(key => {
      const value = this.tags[key];
      if (value === '*') return key;
      if (value === '?') return `?${key}`;
      if (value === '!') return `!${key}`;
      if (value.startsWith('?=')) {
        const raw = value.slice(2);
        return needsQuoting(raw) ? `${key}?=${quoteValue(raw)}` : `${key}?=${raw}`;
      }
      if (value.startsWith('!=')) {
        const raw = value.slice(2);
        return needsQuoting(raw) ? `${key}!=${quoteValue(raw)}` : `${key}!=${raw}`;
      }
      return needsQuoting(value) ? `${key}=${quoteValue(value)}` : `${key}=${value}`;
    });

    return `${this.prefix}:${tagParts.join(';')}`;
  }

  /**
   * Get the value of a specific tag
   * Key is normalized to lowercase for lookup
   *
   * @param {string} key - The tag key
   * @returns {string|undefined} The tag value or undefined if not found
   */
  getTag(key) {
    return this.tags[key.toLowerCase()];
  }

  /**
   * Check if this URN has a specific tag with a specific value
   * Key is normalized to lowercase; value comparison is case-sensitive
   *
   * @param {string} key - The tag key
   * @param {string} value - The tag value to check
   * @returns {boolean} Whether the tag exists with the specified value
   */
  hasTag(key, value) {
    const tagValue = this.tags[key.toLowerCase()];
    return tagValue !== undefined && tagValue === value;
  }

  /**
   * Check whether a marker tag (a tag whose value is "*") is present at
   * the given key. Equivalent to hasTag(tagName, "*") but expresses
   * authorial intent: this tag is present as a marker (a wildcard-valued
   * tag that serializes as just the key), not as a key=value pair.
   * Example: cap:constrained;... has marker tag "constrained".
   *
   * @param {string} tagName - The marker key
   * @returns {boolean} Whether the tag exists with value "*"
   */
  hasMarkerTag(tagName) {
    return this.tags[tagName.toLowerCase()] === '*';
  }

  /**
   * Create a new tagged URN with an added or updated tag
   * Key is normalized to lowercase; value is preserved as-is
   *
   * @param {string} key - The tag key
   * @param {string} value - The tag value
   * @returns {TaggedUrn} A new TaggedUrn instance with the tag added/updated
   */
  withTag(key, value) {
    if (value === '' || value === undefined || value === null) {
      throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${key}' (use '*' for wildcard)`);
    }
    const newTags = { ...this.tags };
    newTags[key.toLowerCase()] = value;
    return new TaggedUrn(this.prefix, newTags, true);
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
    return new TaggedUrn(this.prefix, newTags, true);
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
    return TaggedUrn._checkMatch(this.tags, this.prefix, pattern.tags, pattern.prefix);
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
    return TaggedUrn._checkMatch(instance.tags, instance.prefix, this.tags, this.prefix);
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
  static _checkMatch(instanceTags, instancePrefix, patternTags, patternPrefix) {
    if (instancePrefix !== patternPrefix) {
      throw new TaggedUrnError(
        ErrorCodes.PREFIX_MISMATCH,
        `Cannot compare URNs with different prefixes: '${instancePrefix}' vs '${patternPrefix}'`
      );
    }

    const allKeys = new Set([...Object.keys(instanceTags), ...Object.keys(patternTags)]);

    for (const key of allKeys) {
      const inst = instanceTags[key];
      const patt = patternTags[key];

      if (!valuesMatch(inst, patt)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate specificity score for URN matching.
   * Sum of per-tag truth-table scores. Per-tag ladder:
   *
   *   "?"            -> 0   (no constraint)
   *   starts "?="    -> 1   (absent or not v)
   *   "*"            -> 2   (must-have-any)
   *   starts "!="    -> 3   (present and not v)
   *   exact value    -> 4   (exact match)
   *   "!"            -> 5   (must-not-have)
   *
   * @returns {number} The specificity score
   */
  specificity() {
    let score = 0;
    for (const value of Object.values(this.tags)) {
      score += scoreTagValue(value);
    }
    return score;
  }

  /**
   * Get specificity as a tuple for tie-breaking, ordered from highest
   * score to lowest:
   *   [must_not_have, exact, present_not_value, must_have_any, absent_or_not_value]
   * Compare tuples lexicographically when sum scores are equal.
   * @returns {number[]}
   */
  specificityTuple() {
    let mustNotHave = 0;
    let exact = 0;
    let presentNotValue = 0;
    let mustHaveAny = 0;
    let absentOrNotValue = 0;
    for (const value of Object.values(this.tags)) {
      const { kind } = classifyForm(value);
      if (kind === Form.MUST_NOT_HAVE) mustNotHave++;
      else if (kind === Form.EXACT) exact++;
      else if (kind === Form.PRESENT_NOT_VALUE) presentNotValue++;
      else if (kind === Form.MUST_HAVE_ANY) mustHaveAny++;
      else if (kind === Form.ABSENT_OR_NOT_VALUE) absentOrNotValue++;
      // NO_CONSTRAINT and MISSING contribute nothing
    }
    return [mustNotHave, exact, presentNotValue, mustHaveAny, absentOrNotValue];
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
   * Check if two URNs are equivalent (identical tag sets)
   * a.isEquivalent(b) ≡ a.accepts(b) && b.accepts(a)
   */
  isEquivalent(other) {
    if (!other) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot compare against null URN');
    }
    return this.accepts(other) && other.accepts(this);
  }

  /**
   * Check if two URNs are comparable (one is a specialization of the other)
   * a.isComparable(b) ≡ a.accepts(b) || b.accepts(a)
   */
  isComparable(other) {
    if (!other) {
      throw new TaggedUrnError(ErrorCodes.INVALID_FORMAT, 'cannot compare against null URN');
    }
    return this.accepts(other) || other.accepts(this);
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
      if (baseValue === targetValue) {
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
   * then keys named in `added` are inserted. Unrelated coordinates are
   * preserved.
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
    return new TaggedUrn(this.prefix, nextTags, true);
  }

  /**
   * Create a new URN with a specific tag set to wildcard
   *
   * @param {string} key - The tag key to set to wildcard
   * @returns {TaggedUrn} A new TaggedUrn instance with the tag set to wildcard
   */
  withWildcardTag(key) {
    if (this.tags.hasOwnProperty(key.toLowerCase())) {
      return this.withTag(key, '*');
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
      if (this.tags.hasOwnProperty(normalizedKey)) {
        newTags[normalizedKey] = this.tags[normalizedKey];
      }
    }
    return new TaggedUrn(this.prefix, newTags, true);
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
    return new TaggedUrn(this.prefix, newTags, true);
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
      if (this.tags[thisKeys[i]] !== other.tags[otherKeys[i]]) {
        return false;
      }
    }

    return true;
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
   * Create a new builder with a specified prefix (required)
   * @param {string} prefix - The prefix to use
   */
  constructor(prefix) {
    this._prefix = prefix.toLowerCase();
    this.tags = {};
  }

  /**
   * Add or update a tag
   * Key is normalized to lowercase; value is preserved as-is
   *
   * @param {string} key - The tag key
   * @param {string} value - The tag value
   * @returns {TaggedUrnBuilder} This builder instance for chaining
   */
  tag(key, value) {
    if (value === '' || value === undefined || value === null) {
      throw new TaggedUrnError(ErrorCodes.EMPTY_TAG, `empty value for key '${key}' (use '*' for wildcard)`);
    }
    this.tags[key.toLowerCase()] = value;
    return this;
  }

  /**
   * Add a tag with wildcard value (*)
   * @param {string} key - The tag key
   * @returns {TaggedUrnBuilder} This builder for chaining
   */
  marker(key) {
    this.tags[key.toLowerCase()] = '*';
    return this;
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
    return new TaggedUrn(this._prefix, this.tags, true);
  }

  /**
   * Build the final TaggedUrn, allowing empty tags
   *
   * @returns {TaggedUrn} A new TaggedUrn instance
   */
  buildAllowEmpty() {
    return new TaggedUrn(this._prefix, this.tags, true);
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

// Export for CommonJS
module.exports = {
  TaggedUrn,
  TaggedUrnCoordinateDelta,
  TaggedUrnRelationKind,
  TaggedUrnBuilder,
  UrnMatcher,
  TaggedUrnError,
  ErrorCodes,
  scoreTagValue,
  valuesMatch
};
