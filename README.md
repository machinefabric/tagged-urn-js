# Tagged URN - JavaScript Implementation

Production-ready JavaScript implementation of Tagged URN with strict validation and pattern matching.

## Features

- **Strict Rule Enforcement** - Follows exact same rules as Rust, Go, and Objective-C implementations
- **Tag Forms** - exact `k=v`, present `k`, absent `!k`, unconstrained `?k`, `k?=v` (absent or not v), `k!=v` (present and not v), and sets of values: `k=a|b` (one of), `k!=a|b` (none of), `k?=a|b` (absent or none of), `k=a|b|!` (absent or one of)
- **Typed Tags** - Each tag is stored as the constraint it writes, the proved model's own value, frozen: `{ kind: 'written', absent, values: { kind: 'oneOf' | 'noneOf', vs } }`, made with `Constraint`
- **Identifiers** - The prefix and every key are an ASCII letter followed by ASCII letters, digits and `-`
- **Case Insensitive** - The prefix, keys and unquoted values are lowered; quoted values keep their case
- **Literal Quoting** - A quoted value is always the literal value: `x="*"` is the exact value `*`
- **Tag Order Independent** - Canonical alphabetical sorting
- **Graded Specificity** - `?k` 0, `k?=v` and `k=v|!` 1, `k` 2, `k!=v` and `k=a|b` 3, `k=v` 4, `!k` 5
- **Production Ready** - No fallbacks, fails hard on invalid input
- **Comprehensive Tests** - Full test suite verifying all rules

## Installation

```bash
npm install tagged-urn
```

An ES module for Node.js 20 or later and browsers. Refinement, equivalence,
comparability and specificity are decided by the proved model in
`../formal`, compiled to WebAssembly (`formal/program.wasm`), which the module
loads when it is first imported.

## Quick Start

```javascript
import { Constraint, TaggedUrn, TaggedUrnBuilder, UrnMatcher } from 'tagged-urn';

// Create from string
const urn = TaggedUrn.fromString('cap:generate;ext=pdf');
console.log(urn.toString()); // "cap:ext=pdf;generate"
console.log(urn.getTag('ext'));
// { kind: 'written', absent: false, values: { kind: 'oneOf', vs: ['pdf'] } }
console.log(Constraint.exactValue(urn.getTag('ext'))); // "pdf"

// Use builder pattern
const built = new TaggedUrnBuilder('cap')
  .marker('extract')
  .tag('target', 'metadata')
  .constraint('debug', Constraint.absent())
  .build();
console.log(built.toString()); // "cap:!debug;extract;target=metadata"

// Matching
const request = TaggedUrn.fromString('cap:generate');
console.log(urn.conformsTo(request)); // true

// Find best match
const urns = [
  TaggedUrn.fromString('cap:generate'),
  TaggedUrn.fromString('cap:generate;ext=pdf')
];
const best = UrnMatcher.findBestMatch(urns, request);
console.log(best.toString()); // "cap:ext=pdf;generate" (most specific)
```

## API Reference

### TaggedUrn Class

#### Static Methods
- `TaggedUrn.fromString(s)` - Parse Tagged URN from string
  - Throws `TaggedUrnError` on invalid format
- `TaggedUrn.leastUpperBound(prefix, urns)` - The most specific URN every one of `urns` conforms to, made by the proved model
  - Throws `TaggedUrnError` (PREFIX_MISMATCH) when a URN has another prefix

#### Instance Methods
- `toString()` - Get canonical string representation
- `getTag(key)` - The constraint for a key (case-insensitive), or `undefined`
- `constraint(key)` - The constraint for a key, `missing` when it is not mentioned
- `hasTag(key, value)` - Whether the URN writes the exact value `key=value`
- `hasMarkerTag(key)` - Whether the URN writes the marker `key`
- `withTag(key, constraint)` - Add/replace a tag, checked (returns new instance)
- `withoutTag(key)` - Remove tag (returns new instance)
- `conformsTo(pattern)` - Check if this URN conforms to a pattern
- `accepts(instance)` - Check if this URN (as pattern) accepts an instance
- `specificity()` - Get specificity score for matching
- `isMoreSpecificThan(other)` - Compare specificity
- `compare(other)` - Order by parts: prefix, then each tag by key, constraint form, values
- `TaggedUrn.writeValue(value)` - A value as a tag writes it: bare, or quoted when it must be
- `equals(other)` - Check equality

### Constraint

The model's constraint for one key, as a URN stores it:

| Text | Value |
|---|---|
| `k` | `{ kind: 'written', absent: false, values: { kind: 'noneOf', vs: [] } }` |
| `?k` | `{ kind: 'written', absent: true, values: { kind: 'noneOf', vs: [] } }` |
| `!k` | `{ kind: 'written', absent: true, values: { kind: 'oneOf', vs: [] } }` |
| `k=a\|b` | `{ kind: 'written', absent: false, values: { kind: 'oneOf', vs: ['a', 'b'] } }` |
| `k=a\|b\|!` | `{ kind: 'written', absent: true, values: { kind: 'oneOf', vs: ['a', 'b'] } }` |
| `k!=a\|b` | `{ kind: 'written', absent: false, values: { kind: 'noneOf', vs: ['a', 'b'] } }` |
| `k?=a\|b` | `{ kind: 'written', absent: true, values: { kind: 'noneOf', vs: ['a', 'b'] } }` |

`k=v`, `k!=v` and `k?=v` are the sets of one value. A set's values are each
once, in increasing code-point order. `{ kind: 'missing' }` stands for a key a
URN does not mention and is never stored.

- `Constraint.present()`, `unconstrained()`, `absent()`, `exact(v)`, `presentNot(v)`, `optionalNot(v)` - The forms as the text writes them
- `Constraint.oneOf(values, orAbsent)`, `Constraint.noneOf(values, orAbsent)` - A set of values, made canonical
- `Constraint.exactValue(c)` - The value of `k=v`, or `null` for any other form
- `Constraint.equals(a, b)` - Whether two constraints are the same

### TaggedUrnBuilder Class

Fluent builder for constructing Tagged URNs:

```javascript
const urn = new TaggedUrnBuilder('cap')
  .marker('generate')               // present
  .tag('format', 'json')            // exact value, taken literally
  .constraint('debug', Constraint.absent())
  .build();
```

### UrnMatcher Class

Utility for matching sets of Tagged URNs:

- `UrnMatcher.findBestMatch(urns, request)` - Find most specific match
- `UrnMatcher.findAllMatches(urns, request)` - Find all matches (sorted by specificity)
- `UrnMatcher.areCompatible(urns1, urns2)` - Check if URN sets are compatible

### Error Handling

```javascript
import { TaggedUrnError, ErrorCodes } from 'tagged-urn';

try {
  const urn = TaggedUrn.fromString('invalid:format');
} catch (error) {
  if (error instanceof TaggedUrnError) {
    console.log(`Error code: ${error.code}`);
    console.log(`Message: ${error.message}`);
  }
}
```

Error codes:
- `ErrorCodes.INVALID_FORMAT` - General format error
- `ErrorCodes.MISSING_PREFIX` - No prefix followed by ':'
- `ErrorCodes.EMPTY_PREFIX` - Empty prefix
- `ErrorCodes.INVALID_CHARACTER` - A character not allowed in a prefix, key or value
- `ErrorCodes.INVALID_TAG_FORMAT` - A tag given no constraint, or one no text writes
- `ErrorCodes.DUPLICATE_KEY` - Duplicate tag keys
- `ErrorCodes.DUPLICATE_VALUE` - A value given twice in one tag's set of values
- `ErrorCodes.EMPTY_TAG` - Empty tag components
- `ErrorCodes.UNTERMINATED_QUOTE` - Quoted value never closed
- `ErrorCodes.INVALID_ESCAPE_SEQUENCE` - Escape other than `\"` or `\\`
- `ErrorCodes.PREFIX_MISMATCH` - Comparing URNs of different prefixes
- `ErrorCodes.WHITESPACE_IN_INPUT` - Leading or trailing whitespace

## Rules

This implementation strictly follows the Tagged URN rules. See [Tagged URN RULES.md](https://github.com/machinefabric/tagged-urn-rs/blob/main/docs/RULES.md) for the complete specification.

### Key Rules Summary:

1. **Case Insensitive** - `cap:Format=JSON` == `cap:format=json`; a quoted value keeps its case: `cap:format="JSON"`
2. **Order Independent** - `cap:a=1;b=2` == `cap:b=2;a=1`
3. **Prefix Required** - An identifier followed by `:` (`cap:`, `media:`, …)
4. **Semicolon Separated** - Tags separated by `;`
5. **Optional Trailing `;`** - `cap:a=1;` == `cap:a=1`
6. **Canonical Form** - Lowercase, alphabetically sorted, no trailing `;`, values quoted only when they must be
7. **Forms** - `k=v`, `k`, `!k`, `?k`, `k?=v`, `k!=v`; `k=?v` and `k=!v` are `k?=v` and `k!=v`
8. **Sets of Values** - `k=a|b`, `k!=a|b`, `k?=a|b`, `k=a|b|!`; a bare `!` member means "or absent" only without a qualifier, a value given twice is refused, and a bare `*`, `?`, `?v` or `!v` among the values is refused (quote it)
9. **Identifiers** - The prefix and every key are an ASCII letter followed by ASCII letters, digits and `-`
10. **Unquoted Values** - Any character but `;`, `=`, `|`, `"`, `\` and whitespace
11. **No Duplicate Keys** - Fails hard on duplicates

### Matching Semantics:

Every form means the set of states its key may be in, on either side of a
comparison, and two URNs are compared by those sets. Three questions:

| Question | JavaScript |
|---|---|
| Is everything `a` describes described by `b`? (a guarantee) | `a.conformsTo(b)` |
| Could `a` and `b` be about the same thing? (a possibility) | `a.meets(b)` |
| Does `a`, a complete thing — what it does not mention it does not have — fit `b`? | `a.satisfies(b)` |

What an instance must say to be guaranteed to fit a pattern:

| Pattern | Instance omits K | Instance `K=v` | Instance `K=x` (x≠v) | Instance `K` (any value) |
|---------|------------------|----------------|----------------------|--------------------------|
| (missing) or `?K` | fits | fits | fits | fits |
| `!K` | no — an omission promises nothing | no | no | no |
| `K` (=`K=*`) | no | fits | fits | fits |
| `K=v` | no | fits | no | no — "some value" is not `v` |

A complete thing that omits `K` does fit `!K`: use `satisfies` where the
left side is what something is — a value's media, a cap's own tags — rather than
what something is declared to take or give. "Some value" could be `v`:
`meets` says so, and is the answer a search wants; a route is only ever
taken on a guarantee.

The rules are proved in `../formal` (Lean), and this package runs code generated
from them.

## Testing

```bash
npm test
```

Runs comprehensive test suite covering all rules and edge cases.

## Browser Support

Works in both Node.js and browsers, as an ES module. A page resolves the
`lungo-ts` import (with an import map or a bundler) and serves
`formal/program.wasm` beside `formal/index.js`, where the module fetches it:

```html
<script type="module">
import { TaggedUrn } from './node_modules/tagged-urn/tagged-urn.js';
const urn = TaggedUrn.fromString('cap:generate;in=media:;out=media:');
console.log(urn.toString()); // cap:generate;in=media:;out=media:
</script>
```

## Cross-Language Compatibility

This JavaScript implementation produces identical results to:
- [Rust implementation](https://github.com/machinefabric/tagged-urn-rs)
- [Go implementation](https://github.com/machinefabric/tagged-urn-go)
- [Objective-C implementation](https://github.com/machinefabric/tagged-urn-objc)

All implementations pass the same test cases and follow identical rules.
