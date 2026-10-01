# Tagged URN - JavaScript Implementation

Production-ready JavaScript implementation of Tagged URN with strict validation and pattern matching.

## Features

- **Strict Rule Enforcement** - Follows exact same rules as Rust, Go, and Objective-C implementations
- **Case Insensitive** - All input normalized to lowercase (except quoted values)
- **Tag Order Independent** - Canonical alphabetical sorting
- **Special Pattern Values** - `*` (must-have-any), `?` (unspecified), `!` (must-not-have)
- **Value-less Tags** - Tags without values (`tag`) mean must-have-any (`tag=*`)
- **Extended Characters** - Support for `/` and `:` in tag components
- **Graded Specificity** - Exact values score higher than wildcards
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
import { TaggedUrn, TaggedUrnBuilder, UrnMatcher } from 'tagged-urn';

// Create from string
const urn = TaggedUrn.fromString('cap:generate;ext=pdf');
console.log(urn.toString()); // "cap:ext=pdf;generate"

// Use builder pattern
const built = new TaggedUrnBuilder()
  .marker('extract')
  .tag('target', 'metadata')
  .build();

// Matching
const request = TaggedUrn.fromString('cap:generate;in=media:;out=media:');
console.log(urn.conformsTo(request)); // true

// Find best match
const urns = [
  TaggedUrn.fromString('cap:generate'),
  TaggedUrn.fromString('cap:generate;in=media:;out=media:'),
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

#### Instance Methods
- `toString()` - Get canonical string representation
- `getTag(key)` - Get tag value (case-insensitive)
- `hasTag(key, value)` - Check if tag exists with value
- `withTag(key, value)` - Add/update tag (returns new instance)
- `withoutTag(key)` - Remove tag (returns new instance)
- `conformsTo(pattern)` - Check if this URN conforms to a pattern
- `accepts(instance)` - Check if this URN (as pattern) accepts an instance
- `specificity()` - Get specificity score for matching
- `isMoreSpecificThan(other)` - Compare specificity
- `equals(other)` - Check equality

### TaggedUrnBuilder Class

Fluent builder for constructing Tagged URNs:

```javascript
const urn = new TaggedUrnBuilder()
  .marker('generate')
  .tag('format', 'json')
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
- `ErrorCodes.MISSING_CAP_PREFIX` - Missing "cap:" prefix
- `ErrorCodes.INVALID_CHARACTER` - Invalid characters in tags
- `ErrorCodes.DUPLICATE_KEY` - Duplicate tag keys
- `ErrorCodes.NUMERIC_KEY` - Pure numeric tag keys
- `ErrorCodes.EMPTY_TAG` - Empty tag components

## Rules

This implementation strictly follows the Tagged URN rules. See `RULES.md` for complete specification.

### Key Rules Summary:

1. **Case Insensitive** - `cap:Format=JSON` == `cap:format=JSON` (key is normalized; value preserved)
2. **Order Independent** - `cap:a=1;b=2` == `cap:b=2;a=1`
3. **Prefix Required** - Must start with `cap:`
4. **Semicolon Separated** - Tags separated by `;`
5. **Optional Trailing `;`** - `cap:a=1;` == `cap:a=1`
6. **Canonical Form** - Lowercase, alphabetically sorted, no trailing `;`
7. **Special Values** - `*` (must-have-any), `?` (unspecified), `!` (must-not-have)
8. **Extended Characters** - `/` and `:` allowed in tag components
9. **No Duplicate Keys** - Fails hard on duplicates
10. **No Numeric Keys** - Pure numeric keys forbidden

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
console.log(urn.toString());
</script>
```

## Cross-Language Compatibility

This JavaScript implementation produces identical results to:
- [Rust implementation](https://github.com/machinefabric/tagged-urn-rs)
- [Go implementation](https://github.com/machinefabric/tagged-urn-go)
- [Objective-C implementation](https://github.com/machinefabric/tagged-urn-objc)

All implementations pass the same test cases and follow identical rules.
