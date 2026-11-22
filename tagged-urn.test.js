// Tagged URN JavaScript Test Suite
// Tests mirror the Rust reference implementation (tagged-urn-rs) 1:1
// TEST501-TEST577 numbering shared across all language implementations

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  TaggedUrn,
  TaggedUrnRelationKind,
  TaggedUrnBuilder,
  UrnMatcher,
  TaggedUrnError,
  ErrorCodes,
  Constraint
} from './tagged-urn.js';
import { ASSURANCE } from './formal/index.js';

// Test assertion utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

function assertConstraint(actual, expected, message) {
  if (!Constraint.equals(actual, expected)) {
    throw new Error(`Assertion failed: ${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`Assertion failed: ${message}. Expected: ${b}, Actual: ${a}`);
  }
}

function assertThrows(fn, expectedErrorCode, message) {
  try {
    fn();
    throw new Error(`Expected error but function succeeded: ${message}`);
  } catch (error) {
    if (error instanceof TaggedUrnError && error.code === expectedErrorCode) {
      return; // Expected error
    }
    throw new Error(`Expected TaggedUrnError with code ${expectedErrorCode} but got: ${error.message}`);
  }
}

function assertThrowsAny(fn, message) {
  try {
    fn();
    throw new Error(`Expected error but function succeeded: ${message}`);
  } catch (error) {
    if (error instanceof TaggedUrnError) {
      return; // Expected error
    }
    throw new Error(`Expected TaggedUrnError but got: ${error.message}`);
  }
}

// ============================================================================
// PARSING AND CREATION TESTS (TEST501-TEST518)
// ============================================================================

// TEST501: Verify basic URN creation from string with multiple tags
function test501_tagged_urn_creation() {
  const urn = TaggedUrn.fromString('cap:generate;ext=pdf;target=thumbnail');
  assertEqual(urn.getPrefix(), 'cap', 'Should get prefix');
  assert(urn.hasMarkerTag('generate'), 'Should get op tag');
  assertConstraint(urn.getTag('target'), Constraint.exact('thumbnail'), 'Should get target tag');
  assertConstraint(urn.getTag('ext'), Constraint.exact('pdf'), 'Should get ext tag');
}

// TEST502: Verify custom prefixes work and tags are sorted alphabetically
function test502_custom_prefix() {
  const urn = TaggedUrn.fromString('myapp:generate;ext=pdf');
  assertEqual(urn.getPrefix(), 'myapp', 'Should get custom prefix');
  assert(urn.hasMarkerTag('generate'), 'Should get op tag');
  assertEqual(urn.toString(), 'myapp:ext=pdf;generate', 'Should sort tags alphabetically');
}

// TEST503: Verify prefix is case-insensitive (CAP, cap, Cap all equal)
function test503_prefix_case_insensitive() {
  // Three URNs differing only in prefix case must all normalize to the
  // same `cap` prefix and be equal once parsed.
  const urn1 = TaggedUrn.fromString('CAP:test');
  const urn2 = TaggedUrn.fromString('cap:test');
  const urn3 = TaggedUrn.fromString('Cap:test');

  assertEqual(urn1.getPrefix(), 'cap', 'Should normalize CAP to cap');
  assertEqual(urn2.getPrefix(), 'cap', 'Should normalize cap to cap');
  assertEqual(urn3.getPrefix(), 'cap', 'Should normalize Cap to cap');
  assert(urn1.equals(urn2), 'CAP and cap should be equal');
  assert(urn2.equals(urn3), 'cap and Cap should be equal');
}

// TEST504: Verify error when comparing URNs with different prefixes
function test504_prefix_mismatch_error() {
  const urn1 = TaggedUrn.fromString('cap:in=media:;out=media:;test');
  const urn2 = TaggedUrn.fromString('myapp:test');

  assertThrows(
    () => urn1.conformsTo(urn2),
    ErrorCodes.PREFIX_MISMATCH,
    'Should throw PREFIX_MISMATCH when comparing different prefixes'
  );
}

// TEST505: Verify builder pattern works with custom prefix
function test505_builder_with_prefix() {
  const urn = new TaggedUrnBuilder('custom')
    .tag('key', 'value')
    .build();

  assertEqual(urn.getPrefix(), 'custom', 'Should get custom prefix');
  assertEqual(urn.toString(), 'custom:key=value', 'Should build with custom prefix');
}

// TEST506: Verify unquoted values are normalized to lowercase
function test506_unquoted_values_lowercased() {
  const urn = TaggedUrn.fromString('cap:ext=pdf;generate;target=thumbnail');

  // Keys are always lowercase
  assert(urn.hasMarkerTag('generate'), 'Should have generate marker (key lowercased)');
  assertConstraint(urn.getTag('ext'), Constraint.exact('pdf'), 'Should normalize ext to lowercase');
  assertConstraint(urn.getTag('target'), Constraint.exact('thumbnail'), 'Should normalize target to lowercase');

  // Key lookup is case-insensitive (try uppercase variants of an existing key)
  assertConstraint(urn.getTag('EXT'), Constraint.exact('pdf'), 'Should lookup with uppercase key');
  assertConstraint(urn.getTag('Ext'), Constraint.exact('pdf'), 'Should lookup with mixed case key');

  // Tag order in the source string does not affect canonical form —
  // parsed URNs sort tags alphabetically before serializing.
  const urn2 = TaggedUrn.fromString('cap:target=thumbnail;ext=pdf;generate');
  assertEqual(urn.toString(), urn2.toString(), 'Should produce same canonical form');
  assert(urn.equals(urn2), 'Should be equal after normalization');
}

// TEST507: Verify quoted values preserve their case exactly
function test507_quoted_values_preserve_case() {
  const urn = TaggedUrn.fromString('cap:key="Value With Spaces"');
  assertConstraint(urn.getTag('key'), Constraint.exact('Value With Spaces'), 'Should preserve quoted value case');

  // Key is still lowercase
  const urn2 = TaggedUrn.fromString('cap:KEY="Value With Spaces"');
  assertConstraint(urn2.getTag('key'), Constraint.exact('Value With Spaces'), 'Key should be lowercased');

  // Unquoted vs quoted case difference
  const unquoted = TaggedUrn.fromString('cap:key=UPPERCASE');
  const quoted = TaggedUrn.fromString('cap:key="UPPERCASE"');
  assertConstraint(unquoted.getTag('key'), Constraint.exact('uppercase'), 'Unquoted should be lowercased');
  assertConstraint(quoted.getTag('key'), Constraint.exact('UPPERCASE'), 'Quoted should preserve case');
  assert(!unquoted.equals(quoted), 'Different case values should NOT be equal');
}

// TEST508: Verify semicolons, equals, and spaces in quoted values are allowed
function test508_quoted_value_special_chars() {
  const urn = TaggedUrn.fromString('cap:key="value;with;semicolons"');
  assertConstraint(urn.getTag('key'), Constraint.exact('value;with;semicolons'), 'Should allow semicolons in quotes');

  const urn2 = TaggedUrn.fromString('cap:key="value=with=equals"');
  assertConstraint(urn2.getTag('key'), Constraint.exact('value=with=equals'), 'Should allow equals in quotes');

  const urn3 = TaggedUrn.fromString('cap:key="hello world"');
  assertConstraint(urn3.getTag('key'), Constraint.exact('hello world'), 'Should allow spaces in quotes');
}

// TEST509: Verify escape sequences in quoted values are parsed correctly
function test509_quoted_value_escape_sequences() {
  // Escaped quotes
  const urn = TaggedUrn.fromString('cap:key="value\\"quoted\\""');
  assertConstraint(urn.getTag('key'), Constraint.exact('value"quoted"'), 'Should parse escaped quotes');

  // Escaped backslashes
  const urn2 = TaggedUrn.fromString('cap:key="path\\\\file"');
  assertConstraint(urn2.getTag('key'), Constraint.exact('path\\file'), 'Should parse escaped backslashes');

  // Mixed escapes
  const urn3 = TaggedUrn.fromString('cap:key="say \\"hello\\\\world\\""');
  assertConstraint(urn3.getTag('key'), Constraint.exact('say "hello\\world"'), 'Should parse mixed escapes');
}

// TEST510: Verify mixing quoted and unquoted values in same URN
function test510_mixed_quoted_unquoted() {
  const urn = TaggedUrn.fromString('cap:a="Quoted";b=simple');
  assertConstraint(urn.getTag('a'), Constraint.exact('Quoted'), 'Quoted value should preserve case');
  assertConstraint(urn.getTag('b'), Constraint.exact('simple'), 'Unquoted value should be lowercase');
}

// TEST511: Verify error on unterminated quoted value
function test511_unterminated_quote_error() {
  assertThrows(
    () => TaggedUrn.fromString('cap:key="unterminated'),
    ErrorCodes.UNTERMINATED_QUOTE,
    'Should reject unterminated quote'
  );
}

// TEST512: Verify error on invalid escape sequences (only \\" and \\\\ allowed)
function test512_invalid_escape_sequence_error() {
  assertThrows(
    () => TaggedUrn.fromString('cap:key="bad\\n"'),
    ErrorCodes.INVALID_ESCAPE_SEQUENCE,
    'Should reject \\n escape'
  );

  assertThrows(
    () => TaggedUrn.fromString('cap:key="bad\\x"'),
    ErrorCodes.INVALID_ESCAPE_SEQUENCE,
    'Should reject \\x escape'
  );
}

// TEST513: Verify smart quoting: quotes only when necessary
function test513_serialization_smart_quoting() {
  // Simple lowercase value - no quoting needed
  const urn = new TaggedUrnBuilder('cap').tag('key', 'simple').build();
  assertEqual(urn.toString(), 'cap:key=simple', 'Simple value should not be quoted');

  // Value with spaces - needs quoting
  const urn2 = TaggedUrn.fromString('cap:key="has spaces"');
  assert(urn2.toString().includes('"'), 'Value with spaces should be quoted');

  // Value with semicolons - needs quoting
  const urn3 = TaggedUrn.fromString('cap:key="has;semi"');
  assert(urn3.toString().includes('"'), 'Value with semicolons should be quoted');

  // Value with uppercase - needs quoting to preserve
  const urn4 = TaggedUrn.fromString('cap:key="HasUpper"');
  assert(urn4.toString().includes('"'), 'Value with uppercase should be quoted');

  // Value with quotes - needs quoting and escaping
  const urn5 = TaggedUrn.fromString('cap:key="has\\"quote"');
  const s5 = urn5.toString();
  assert(s5.includes('\\"'), 'Value with quotes should be escaped');

  // Value with backslashes - needs quoting and escaping
  const urn6 = TaggedUrn.fromString('cap:key="path\\\\file"');
  const s6 = urn6.toString();
  assert(s6.includes('\\\\'), 'Value with backslashes should be escaped');
}

// TEST514: Verify simple URN round-trips correctly (parse -> serialize -> parse)
function test514_round_trip_simple() {
  const original = 'cap:ext=pdf;generate;in=media:;out=media:';
  const urn = TaggedUrn.fromString(original);
  const serialized = urn.toString();
  const reparsed = TaggedUrn.fromString(serialized);
  assert(urn.equals(reparsed), 'Should round-trip correctly');
}

// TEST515: Verify quoted values round-trip correctly
function test515_round_trip_quoted() {
  const original = 'cap:key="Value With Spaces"';
  const urn = TaggedUrn.fromString(original);
  const serialized = urn.toString();
  const reparsed = TaggedUrn.fromString(serialized);
  assert(urn.equals(reparsed), 'Should round-trip quoted values');
  assertConstraint(reparsed.getTag('key'), Constraint.exact('Value With Spaces'), 'Should preserve quoted value');
}

// TEST516: Verify escape sequences round-trip correctly
function test516_round_trip_escapes() {
  const original = 'cap:key="value\\"with\\\\escapes"';
  const urn = TaggedUrn.fromString(original);
  assertConstraint(urn.getTag('key'), Constraint.exact('value"with\\escapes'), 'Should parse escapes');
  const serialized = urn.toString();
  const reparsed = TaggedUrn.fromString(serialized);
  assert(urn.equals(reparsed), 'Should round-trip escapes');
}

// TEST517: Verify missing prefix causes error
function test517_prefix_required() {
  assertThrows(
    () => TaggedUrn.fromString('generate;ext=pdf'),
    ErrorCodes.MISSING_PREFIX,
    'Should require prefix'
  );

  assertThrows(
    () => TaggedUrn.fromString(':generate'),
    ErrorCodes.EMPTY_PREFIX,
    'Should reject empty prefix'
  );

  const urn = TaggedUrn.fromString('cap:generate;ext=pdf');
  assert(urn.hasMarkerTag('generate'), 'Should parse with valid prefix');

  // Case-insensitive prefix
  const urn2 = TaggedUrn.fromString('CAP:generate');
  assert(urn2.hasMarkerTag('generate'), 'Should parse with uppercase prefix');
}

// TEST518: Verify trailing semicolon is optional and doesn't affect equality
function test518_trailing_semicolon_equivalence() {
  const urn1 = TaggedUrn.fromString('cap:generate;ext=pdf');
  const urn2 = TaggedUrn.fromString('cap:generate;ext=pdf;');

  assert(urn1.equals(urn2), 'Should be equal with/without trailing semicolon');
  assertEqual(urn1.toString(), urn2.toString(), 'Should have same canonical form');
  assert(urn1.conformsTo(urn2), 'Should match each other');
  assert(urn2.conformsTo(urn1), 'Should match each other');
}

// ============================================================================
// CANONICAL FORM (TEST519)
// ============================================================================

// TEST519: Verify canonical form: alphabetically sorted tags, no trailing semicolon
function test519_canonical_string_format() {
  const urn = TaggedUrn.fromString('cap:generate;target=thumbnail;ext=pdf');
  assertEqual(urn.toString(), 'cap:ext=pdf;generate;target=thumbnail', 'Should be alphabetically sorted');
}

// ============================================================================
// TAG ACCESS AND MATCHING (TEST520-TEST522)
// ============================================================================

// TEST520: Verify hasTag and getTag methods work correctly
function test520_tag_matching() {
  const cap = TaggedUrn.fromString('cap:generate;ext=pdf;target=thumbnail');

  const request1 = TaggedUrn.fromString('cap:generate;ext=pdf;target=thumbnail');
  assert(cap.conformsTo(request1), 'Should match exact request');

  // Subset pattern: pattern with fewer constraints (only marker
  // `generate`). Instance has all of pattern's constraints plus more.
  const request2 = TaggedUrn.fromString('cap:generate');
  assert(cap.conformsTo(request2), 'Should match subset request');

  const request3 = TaggedUrn.fromString('cap:ext=*');
  assert(cap.conformsTo(request3), 'Should match wildcard request');

  // Pattern requires marker `extract` which instance lacks.
  const request4 = TaggedUrn.fromString('cap:extract');
  assert(!cap.conformsTo(request4), 'Should not match conflicting value');
}

// TEST521: Verify value matching is case-sensitive
function test521_matching_case_sensitive_values() {
  // Same tag content, written with mixed case. Unquoted keys + values
  // are lowercased on parse, so these two URN strings produce equal
  // URNs.
  const cap1 = TaggedUrn.fromString('cap:Ext=PDF;Generate;Target=Thumbnail');
  const cap2 = TaggedUrn.fromString('cap:generate;ext=pdf;target=thumbnail');

  assert(cap1.equals(cap2), 'URNs with unquoted case differences should be equal');
  assert(cap1.conformsTo(cap2), 'Should match case-insensitively');
  assert(cap2.conformsTo(cap1), 'Should match case-insensitively');

  // Case-insensitive marker tag lookup (key is normalized).
  assert(cap1.hasMarkerTag('GENERATE'), 'Should match marker with uppercase key');
  assert(cap1.hasMarkerTag('Generate'), 'Should match marker with mixed case key');

  // Case-insensitive keyed tag lookup.
  assertConstraint(cap1.getTag('EXT'), Constraint.exact('pdf'), 'Should lookup keyed tag with uppercase key');
  assert(cap1.hasTag('ext', 'pdf'), 'hasTag should match with lowercase key');
  assert(cap1.hasTag('EXT', 'pdf'), 'hasTag should match with uppercase key');
}

// TEST522: Verify handling of missing tags in conformsTo semantics
function test522_missing_tag_handling() {
  const instance = TaggedUrn.fromString('cap:generate');

  // Pattern with tag that instance doesn't have: NO MATCH
  const pattern1 = TaggedUrn.fromString('cap:ext=pdf');
  assert(!instance.conformsTo(pattern1), 'Should NOT match when instance missing pattern-required tag');

  // Subset pattern (pattern requires only `generate` marker, which
  // instance has): MATCH.
  const instance2 = TaggedUrn.fromString('cap:generate;ext=pdf');
  const pattern2 = TaggedUrn.fromString('cap:generate');
  assert(instance2.conformsTo(pattern2), 'Should match subset pattern');

  // ?x means no constraint
  const pattern3 = TaggedUrn.fromString('cap:?ext');
  assert(instance.conformsTo(pattern3), 'Pattern ?ext should match instance without ext');

  // * means must-have-any
  const pattern4 = TaggedUrn.fromString('cap:ext=*');
  assert(!instance.conformsTo(pattern4), 'Pattern ext=* should NOT match when instance missing ext');
}

// ============================================================================
// SPECIFICITY (TEST523)
// ============================================================================

// TEST523: Verify six-form per-tag specificity ladder.
//   ?x        : 0
//   x?=v      : 1
//   x (=x=*)  : 2
//   x!=v      : 3
//   x=v       : 4
//   !x        : 5
function test523_specificity() {
  const cap1 = TaggedUrn.fromString('cap:general');     // bare marker -> 2
  const cap2 = TaggedUrn.fromString('cap:ext=pdf');     // exact -> 4
  const cap3 = TaggedUrn.fromString('cap:gen;ext=pdf'); // marker(2) + exact(4)
  const cap4 = TaggedUrn.fromString('cap:?ext');        // ?x -> 0
  const cap5 = TaggedUrn.fromString('cap:!ext');        // !x -> 5
  const cap6 = TaggedUrn.fromString('cap:ext?=pdf');    // x?=v -> 1
  const cap7 = TaggedUrn.fromString('cap:ext!=pdf');    // x!=v -> 3

  assertEqual(cap1.specificity(), 2, 'bare marker -> 2');
  assertEqual(cap2.specificity(), 4, 'exact -> 4');
  assertEqual(cap3.specificity(), 6, 'marker + exact -> 6');
  assertEqual(cap4.specificity(), 0, '?x -> 0');
  assertEqual(cap5.specificity(), 5, '!x -> 5');
  assertEqual(cap6.specificity(), 1, 'x?=v -> 1');
  assertEqual(cap7.specificity(), 3, 'x!=v -> 3');

  assert(cap2.isMoreSpecificThan(cap1), 'exact(4) > marker(2)');
}

// ============================================================================
// BUILDER (TEST524-TEST525)
// ============================================================================

// TEST524: Verify builder creates correct URN
function test524_builder() {
  const cap = new TaggedUrnBuilder('cap')
    .marker('generate')
    .tag('target', 'thumbnail')
    .tag('ext', 'pdf')
    .tag('output', 'binary')
    .build();

  assert(cap.hasMarkerTag('generate'), 'Should build with generate marker');
  assertConstraint(cap.getTag('output'), Constraint.exact('binary'), 'Should build with output tag');
}

// TEST525: Verify builder preserves case in quoted values
function test525_builder_preserves_case() {
  const urn = new TaggedUrnBuilder('cap')
    .tag('key', 'ValueWithCase')
    .build();
  assertConstraint(urn.getTag('key'), Constraint.exact('ValueWithCase'), 'Should preserve case in builder');
}

// ============================================================================
// COMPATIBILITY AND MATCHING (TEST526-TEST527)
// ============================================================================

// TEST526: Verify directional accepts for URN matching
function test526_compatibility() {
  // General pattern (single marker) accepts a more specific instance
  // (same marker plus extra tags). The reverse direction is rejected
  // because the specific pattern requires `ext=pdf` which the general
  // instance does not have.
  const general = TaggedUrn.fromString('cap:generate');
  const specific = TaggedUrn.fromString('cap:generate;ext=pdf');
  assert(general.accepts(specific), 'General pattern accepts specific instance');
  assert(!specific.accepts(general), 'Specific does not accept general');

  // Wildcard pattern accepts any value for the same key
  const wildcard = TaggedUrn.fromString('cap:generate;format=*');
  const withFormat = TaggedUrn.fromString('cap:generate;format=json');
  assert(wildcard.accepts(withFormat), 'Wildcard accepts specific value');

  // Different markers: neither accepts the other (both require their
  // own marker to be present on the other side, and neither has it).
  const cap1 = TaggedUrn.fromString('cap:generate;ext=pdf');
  const cap3 = TaggedUrn.fromString('cap:extract;image');
  assert(!cap1.accepts(cap3), 'Different marker should not accept');
  assert(!cap3.accepts(cap1), 'Different marker should not accept (reverse)');
}

// TEST527: Verify UrnMatcher finds best match among candidates
function test527_best_match() {
  // Three candidates of increasing specificity. The request asks for any
  // URN with the `generate` marker; the matcher must pick the most
  // specific candidate that satisfies the request.
  const caps = [
    TaggedUrn.fromString('cap:generate'),                  // 1 marker = 2
    TaggedUrn.fromString('cap:generate;ext=pdf'),          // 1 marker + 1 exact = 5
    TaggedUrn.fromString('cap:generate;ext=pdf;target=thumb') // 1 marker + 2 exact = 8
  ];

  const request = TaggedUrn.fromString('cap:generate');
  const best = UrnMatcher.findBestMatch(caps, request);
  assertEqual(best.toString(), 'cap:ext=pdf;generate;target=thumb', 'Should find most specific match');

  const matches = UrnMatcher.findAllMatches(caps, request);
  assertEqual(matches.length, 3, 'Should find all matches');
  assertEqual(matches[0].toString(), 'cap:ext=pdf;generate;target=thumb', 'Should sort by specificity');
}

// ============================================================================
// SET OPERATIONS (TEST528-TEST529)
// ============================================================================

// TEST528: Verify merge and subset operations
function test528_merge_and_subset() {
  // Merge: union of both tag sets, sorted alphabetically by key.
  const cap1 = TaggedUrn.fromString('cap:generate');
  const cap2 = TaggedUrn.fromString('cap:ext=pdf;output=binary');
  const merged = cap1.merge(cap2);
  assertEqual(merged.toString(), 'cap:ext=pdf;generate;output=binary', 'Should merge correctly');

  // Subset keeps only the specified keys ('type' is absent so only 'ext' survives).
  const subset = merged.subset(['type', 'ext']);
  assertEqual(subset.toString(), 'cap:ext=pdf', 'Should create subset correctly');
}

// TEST529: Verify error when merging URNs with different prefixes
function test529_merge_prefix_mismatch() {
  const urn1 = TaggedUrn.fromString('cap:in=media:;out=media:;test');
  const urn2 = TaggedUrn.fromString('myapp:test');

  assertThrows(
    () => urn1.merge(urn2),
    ErrorCodes.PREFIX_MISMATCH,
    'Should throw PREFIX_MISMATCH when merging different prefixes'
  );
}

// ============================================================================
// WILDCARDS (TEST530)
// ============================================================================

// TEST530: Verify wildcard value matching behavior
function test530_wildcard_tag() {
  const cap = TaggedUrn.fromString('cap:ext=pdf');
  const wildcarded = cap.withWildcardTag('ext');
  assertEqual(wildcarded.toString(), 'cap:ext', 'Should set wildcard (serializes as value-less)');
}

// ============================================================================
// EMPTY URNs (TEST531-TEST532)
// ============================================================================

// TEST531: Verify empty URN (no tags) is valid and matches everything
function test531_empty_tagged_urn() {
  const empty = TaggedUrn.fromString('cap:');
  assertEqual(Object.keys(empty.tags).length, 0, 'Should have no tags');
  assertEqual(empty.toString(), 'cap:', 'Should have correct string representation');

  const specific = TaggedUrn.fromString('cap:generate;ext=pdf');

  // Empty instance vs specific pattern: NO MATCH
  assert(!empty.conformsTo(specific), 'Empty instance should NOT match pattern with requirements');

  // Specific instance vs empty pattern: MATCH
  assert(specific.conformsTo(empty), 'Instance should match empty pattern');

  // Empty instance vs empty pattern: MATCH
  assert(empty.conformsTo(empty), 'Should match itself');
}

// TEST532: Verify empty URN works with custom prefix
function test532_empty_with_custom_prefix() {
  const empty = TaggedUrn.fromString('myapp:');
  assertEqual(empty.getPrefix(), 'myapp', 'Should get custom prefix');
  assertEqual(empty.toString(), 'myapp:', 'Should have correct string representation');
}

// ============================================================================
// CHARACTER SUPPORT AND VALIDATION (TEST533-TEST542)
// ============================================================================

// TEST533: Verify forward slashes and colons in tag components
function test533_extended_character_support() {
  const cap = TaggedUrn.fromString('cap:url=https://example_org/api;path=/some/file');
  assertConstraint(cap.getTag('url'), Constraint.exact('https://example_org/api'), 'Should support colons and slashes');
  assertConstraint(cap.getTag('path'), Constraint.exact('/some/file'), 'Should support slashes');
}

// TEST534: Verify wildcard cannot be used as a key
function test534_wildcard_restrictions() {
  assertThrows(
    () => TaggedUrn.fromString('cap:*=value'),
    ErrorCodes.INVALID_CHARACTER,
    'Should reject wildcard in key'
  );

  const cap = TaggedUrn.fromString('cap:key=*');
  assertConstraint(cap.getTag('key'), Constraint.present(), 'Should accept wildcard in value');
}

// TEST535: Verify duplicate keys are rejected with error
function test535_duplicate_key_rejection() {
  assertThrows(
    () => TaggedUrn.fromString('cap:key=value1;key=value2'),
    ErrorCodes.DUPLICATE_KEY,
    'Should reject duplicate keys'
  );
}

// TEST536: Verify keys that begin with a digit are rejected and digits after the first letter are allowed
function test536_numeric_key_restriction() {
  assertThrows(
    () => TaggedUrn.fromString('cap:123=value'),
    ErrorCodes.INVALID_CHARACTER,
    'Should reject numeric keys'
  );
  assertThrows(
    () => TaggedUrn.fromString('cap:123key=value'),
    ErrorCodes.INVALID_CHARACTER,
    'Should reject keys that begin with a digit'
  );

  const mixedKey1 = TaggedUrn.fromString('cap:key123=value');
  assertConstraint(mixedKey1.getTag('key123'), Constraint.exact('value'), 'Should allow digits after the first letter');

  const numericValue = TaggedUrn.fromString('cap:key=123');
  assertConstraint(numericValue.getTag('key'), Constraint.exact('123'), 'Should allow numeric values');
}

// TEST537: Verify empty values (key=) cause error
function test537_empty_value_error() {
  assertThrows(
    () => TaggedUrn.fromString('cap:key='),
    ErrorCodes.EMPTY_TAG,
    'Should reject empty value'
  );
  assertThrows(
    () => TaggedUrn.fromString('cap:key=;other=value'),
    ErrorCodes.EMPTY_TAG,
    'Should reject empty value mid-string'
  );
}

// TEST538: Verify hasTag value comparison is case-sensitive
function test538_has_tag_case_sensitive() {
  const urn = TaggedUrn.fromString('cap:key="Value"');

  // Exact case match works
  assert(urn.hasTag('key', 'Value'), 'Should match exact case');

  // Different case does not match
  assert(!urn.hasTag('key', 'value'), 'Should not match different case');
  assert(!urn.hasTag('key', 'VALUE'), 'Should not match different case');

  // Key lookup is case-insensitive
  assert(urn.hasTag('KEY', 'Value'), 'Key lookup should be case-insensitive');
  assert(urn.hasTag('Key', 'Value'), 'Key lookup should be case-insensitive');
}

// TEST539: Verify withTag preserves value case
function test539_with_tag_preserves_value() {
  const urn = TaggedUrn.empty('cap').withTag('key', Constraint.exact('ValueWithCase'));
  assertConstraint(urn.getTag('key'), Constraint.exact('ValueWithCase'), 'Should preserve value case');
}

// TEST540: Verify withTag rejects empty value
function test540_with_tag_rejects_empty_value() {
  assertThrows(
    () => TaggedUrn.empty('cap').withTag('key', Constraint.exact('')),
    ErrorCodes.EMPTY_TAG,
    'Should reject empty value in withTag'
  );
}

// TEST541: Verify builder rejects empty value
function test541_builder_rejects_empty_value() {
  assertThrows(
    () => new TaggedUrnBuilder('cap').tag('key', ''),
    ErrorCodes.EMPTY_TAG,
    'Should reject empty value in builder'
  );
}

// TEST542: Verify unquoted and quoted simple lowercase values are equivalent
function test542_semantic_equivalence() {
  const unquoted = TaggedUrn.fromString('cap:key=simple');
  const quoted = TaggedUrn.fromString('cap:key="simple"');
  assert(unquoted.equals(quoted), 'Unquoted and quoted lowercase should be equal');

  // Both serialize the same way (unquoted)
  assertEqual(unquoted.toString(), 'cap:key=simple', 'Unquoted should serialize as unquoted');
  assertEqual(quoted.toString(), 'cap:key=simple', 'Quoted lowercase should serialize as unquoted');
}

// ============================================================================
// MATCHING SEMANTICS CORE (TEST543-TEST552)
// ============================================================================

// TEST543: Instance and pattern have same tag/value - matches
function test543_matching_semantics_exact_match() {
  const cap = TaggedUrn.fromString('cap:generate;ext=pdf');
  const request = TaggedUrn.fromString('cap:generate;ext=pdf');
  assert(cap.conformsTo(request), 'Exact match should succeed');
}

// TEST544: Pattern requires tag but instance doesn't have it - no match
function test544_matching_semantics_instance_missing_tag() {
  const instance = TaggedUrn.fromString('cap:generate;in=media:;out=media:');
  const pattern = TaggedUrn.fromString('cap:generate;ext=pdf');
  assert(!instance.conformsTo(pattern), 'Instance missing tag should NOT match');

  const patternOptional = TaggedUrn.fromString('cap:generate;ext=?');
  assert(instance.conformsTo(patternOptional), 'Pattern with ext=? should match instance without ext');
}

// TEST545: Instance has extra tag not in pattern - still matches
function test545_matching_semantics_extra_tag() {
  const cap = TaggedUrn.fromString('cap:generate;ext=pdf;version=2');
  const request = TaggedUrn.fromString('cap:generate;ext=pdf');
  assert(cap.conformsTo(request), 'Cap with extra tag should match');
}

// TEST546: Pattern has wildcard - matches any value
function test546_matching_semantics_request_wildcard() {
  const cap = TaggedUrn.fromString('cap:generate;ext=pdf');
  const request = TaggedUrn.fromString('cap:generate;ext=*');
  assert(cap.conformsTo(request), 'Request wildcard should match');
}

// TEST547: An instance's wildcard promises presence, not the value asked for
//
// `ext=*` is "some ext". It does not satisfy a pattern asking for `ext=pdf` —
// that would let a cap promising some ext stand in for one that produces a
// pdf — while a pdf does satisfy a pattern asking for some ext.
function test547_matching_semantics_cap_wildcard() {
  const cap = TaggedUrn.fromString('cap:generate;ext=*');
  const request = TaggedUrn.fromString('cap:generate;ext=pdf');
  assert(!cap.conformsTo(request), 'some ext does not satisfy ext=pdf');
  assert(request.conformsTo(cap), 'ext=pdf satisfies some ext');
}

// TEST548: Instance and pattern have same key but different values - no match
function test548_matching_semantics_value_mismatch() {
  const cap = TaggedUrn.fromString('cap:generate;ext=pdf');
  const request = TaggedUrn.fromString('cap:generate;ext=docx');
  assert(!cap.conformsTo(request), 'Value mismatch should not match');
}

// TEST549: Pattern has constraint instance doesn't have - no match
function test549_matching_semantics_pattern_extra_tag() {
  const instance = TaggedUrn.fromString('cap:generate-thumbnail;out="media:binary"');
  const pattern = TaggedUrn.fromString('cap:generate-thumbnail;out="media:binary";ext=wav');
  assert(!instance.conformsTo(pattern), 'Instance missing ext should NOT match pattern requiring ext=wav');

  const patternNoExt = TaggedUrn.fromString('cap:generate-thumbnail;out="media:binary"');
  assert(instance.conformsTo(patternNoExt), 'Should match pattern without ext constraint');
}

// TEST550: Empty pattern matches any instance
function test550_matching_semantics_empty_pattern() {
  const instance = TaggedUrn.fromString('cap:generate;ext=pdf');
  const emptyPattern = TaggedUrn.fromString('cap:');
  assert(instance.conformsTo(emptyPattern), 'Any instance should match empty pattern');

  const emptyInstance = TaggedUrn.fromString('cap:');
  const pattern = TaggedUrn.fromString('cap:generate;ext=pdf');
  assert(!emptyInstance.conformsTo(pattern), 'Empty instance should NOT match pattern with requirements');
}

// TEST551: Multiple independent tag constraints work correctly
function test551_matching_semantics_cross_dimension() {
  const instance = TaggedUrn.fromString('cap:generate;in=media:;out=media:');
  const pattern = TaggedUrn.fromString('cap:ext=pdf');
  assert(!instance.conformsTo(pattern), 'Instance without ext should NOT match pattern requiring ext');

  const instance2 = TaggedUrn.fromString('cap:generate;ext=pdf');
  const pattern2 = TaggedUrn.fromString('cap:ext=pdf');
  assert(instance2.conformsTo(pattern2), 'Instance with ext=pdf should match');
}

// TEST552: Matching URNs with different prefixes returns error
function test552_matching_different_prefixes_error() {
  const urn1 = TaggedUrn.fromString('cap:in=media:;out=media:;test');
  const urn2 = TaggedUrn.fromString('other:test');

  assertThrows(
    () => urn1.conformsTo(urn2),
    ErrorCodes.PREFIX_MISMATCH,
    'conformsTo with different prefixes should throw'
  );

  assertThrows(
    () => urn1.accepts(urn2),
    ErrorCodes.PREFIX_MISMATCH,
    'accepts with different prefixes should throw'
  );

  assertThrows(
    () => urn1.isMoreSpecificThan(urn2),
    ErrorCodes.PREFIX_MISMATCH,
    'isMoreSpecificThan with different prefixes should throw'
  );
}

// ============================================================================
// VALUELESS TAG TESTS (TEST553-TEST566)
// ============================================================================

// TEST553: Single value-less tag parses as wildcard
function test553_valueless_tag_parsing_single() {
  const urn = TaggedUrn.fromString('cap:optimize');
  assertConstraint(urn.getTag('optimize'), Constraint.present(), 'Should parse value-less tag as wildcard');
  assertEqual(urn.toString(), 'cap:optimize', 'Should serialize without =*');
}

// TEST554: Multiple value-less tags parse correctly
function test554_valueless_tag_parsing_multiple() {
  const urn = TaggedUrn.fromString('cap:fast;optimize;secure');
  assertConstraint(urn.getTag('fast'), Constraint.present(), 'Should parse first value-less tag');
  assertConstraint(urn.getTag('optimize'), Constraint.present(), 'Should parse second value-less tag');
  assertConstraint(urn.getTag('secure'), Constraint.present(), 'Should parse third value-less tag');
  assertEqual(urn.toString(), 'cap:fast;optimize;secure', 'Should serialize alphabetically');
}

// TEST555: Mix of valueless and valued tags works
function test555_valueless_tag_mixed_with_valued() {
  const urn = TaggedUrn.fromString('cap:generate;optimize;ext=pdf;secure');
  assert(urn.hasMarkerTag('generate'), 'Should parse valued tag');
  assertConstraint(urn.getTag('optimize'), Constraint.present(), 'Should parse value-less tag');
  assertConstraint(urn.getTag('ext'), Constraint.exact('pdf'), 'Should parse valued tag');
  assertConstraint(urn.getTag('secure'), Constraint.present(), 'Should parse value-less tag');
  assertEqual(urn.toString(), 'cap:ext=pdf;generate;optimize;secure', 'Should serialize alphabetically');
}

// TEST556: Valueless tag at end (no trailing semicolon) works
function test556_valueless_tag_at_end() {
  const urn = TaggedUrn.fromString('cap:generate;optimize');
  assert(urn.hasMarkerTag('generate'), 'Should parse valued tag');
  assertConstraint(urn.getTag('optimize'), Constraint.present(), 'Should parse value-less tag');
  assertEqual(urn.toString(), 'cap:generate;optimize', 'Should serialize correctly');
}

// TEST557: Valueless tag is equivalent to explicit wildcard
function test557_valueless_tag_equivalence_to_wildcard() {
  const valueless = TaggedUrn.fromString('cap:ext');
  const wildcard = TaggedUrn.fromString('cap:ext=*');
  assert(valueless.equals(wildcard), 'Value-less should equal explicit wildcard');
  assertEqual(valueless.toString(), 'cap:ext', 'Value-less should serialize as value-less');
  assertEqual(wildcard.toString(), 'cap:ext', 'Wildcard should serialize as value-less');
}

// TEST558: A valueless tag promises presence, not a value
//
// `ext` says the key is there with SOME value. It used to satisfy any pattern
// asking for a particular one — "decided later" — which made `ext` and
// `ext=pdf` refine each other, so they counted as equivalent, and a candidate
// promising only "some ext" was routed to a request needing a pdf. Refinement
// is inclusion of what each form allows: every pdf is some ext, not the reverse.
function test558_valueless_tag_matching() {
  const urn = TaggedUrn.fromString('cap:generate;ext');
  const requestPdf = TaggedUrn.fromString('cap:generate;ext=pdf');
  const requestDocx = TaggedUrn.fromString('cap:generate;ext=docx');

  assert(!urn.conformsTo(requestPdf), 'some ext is not a promise of pdf');
  assert(!urn.conformsTo(requestDocx), 'some ext is not a promise of docx');
  assert(requestPdf.conformsTo(urn), 'a pdf is some ext');
  assert(!urn.isEquivalent(requestPdf), 'ext and ext=pdf are different tag sets');
}

// TEST559: Pattern with valueless tag requires instance to have tag (any value)
function test559_valueless_tag_in_pattern() {
  const pattern = TaggedUrn.fromString('cap:generate;ext');
  const instancePdf = TaggedUrn.fromString('cap:generate;ext=pdf');
  const instanceDocx = TaggedUrn.fromString('cap:generate;ext=docx');
  const instanceMissing = TaggedUrn.fromString('cap:generate;in=media:;out=media:');

  assert(instancePdf.conformsTo(pattern), 'Should match pdf instance');
  assert(instanceDocx.conformsTo(pattern), 'Should match docx instance');
  assert(!instanceMissing.conformsTo(pattern), 'Should NOT match instance without ext');

  const patternOptional = TaggedUrn.fromString('cap:generate;ext=?');
  assert(instanceMissing.conformsTo(patternOptional), 'Instance should match pattern with ext=?');
}

// TEST560: Bare marker (=`x=*`) contributes 2 points; exact contributes 4.
function test560_valueless_tag_specificity() {
  const urn1 = TaggedUrn.fromString('cap:generate');           // 1 marker
  const urn2 = TaggedUrn.fromString('cap:generate;optimize');  // 2 markers
  const urn3 = TaggedUrn.fromString('cap:generate;ext=pdf');   // 1 marker + 1 exact

  assertEqual(urn1.specificity(), 2, '1 marker = 2');
  assertEqual(urn2.specificity(), 4, '2 markers = 2 + 2 = 4');
  assertEqual(urn3.specificity(), 6, '1 marker + 1 exact = 2 + 4 = 6');
}

// TEST561: Valueless tags round-trip correctly (serialize as just key)
function test561_valueless_tag_roundtrip() {
  const original = 'cap:ext=pdf;generate;optimize;secure';
  const urn = TaggedUrn.fromString(original);
  const serialized = urn.toString();
  const reparsed = TaggedUrn.fromString(serialized);
  assert(urn.equals(reparsed), 'Should roundtrip correctly');
  assertEqual(serialized, original, 'Serialized should match original');
}

// TEST562: Valueless tags normalized to lowercase
function test562_valueless_tag_case_normalization() {
  const urn = TaggedUrn.fromString('cap:OPTIMIZE;Fast;SECURE');
  assertConstraint(urn.getTag('optimize'), Constraint.present(), 'Should normalize to lowercase');
  assertConstraint(urn.getTag('fast'), Constraint.present(), 'Should normalize to lowercase');
  assertConstraint(urn.getTag('secure'), Constraint.present(), 'Should normalize to lowercase');
  assertEqual(urn.toString(), 'cap:fast;optimize;secure', 'Should serialize as lowercase');
}

// TEST563: Empty value with = is still error (different from valueless)
function test563_empty_value_still_error() {
  assertThrows(
    () => TaggedUrn.fromString('cap:key='),
    ErrorCodes.EMPTY_TAG,
    'Should reject empty value with ='
  );
  assertThrows(
    () => TaggedUrn.fromString('cap:key=;other=value'),
    ErrorCodes.EMPTY_TAG,
    'Should reject empty value mid-string'
  );
}

// TEST564: Valueless tags (wildcard) accept any specific value
function test564_valueless_tag_compatibility() {
  const wildcard = TaggedUrn.fromString('cap:generate;ext');
  const pdf = TaggedUrn.fromString('cap:generate;ext=pdf');
  const docx = TaggedUrn.fromString('cap:generate;ext=docx');

  // Wildcard ext accepts both pdf and docx instances
  assert(wildcard.accepts(pdf), 'Wildcard ext should accept pdf');
  assert(wildcard.accepts(docx), 'Wildcard ext should accept docx');
  // Specific values: pdf does not accept docx and vice versa
  assert(!pdf.accepts(docx), 'pdf should not accept docx');
  assert(!docx.accepts(pdf), 'docx should not accept pdf');
}

// TEST565: Purely numeric keys still rejected for valueless tags
function test565_valueless_numeric_key_still_rejected() {
  assertThrows(
    () => TaggedUrn.fromString('cap:123'),
    ErrorCodes.INVALID_CHARACTER,
    'Should reject numeric key'
  );
  assertThrows(
    () => TaggedUrn.fromString('cap:generate;456'),
    ErrorCodes.INVALID_CHARACTER,
    'Should reject numeric key'
  );
}

// TEST566: Leading/trailing whitespace in input is rejected
function test566_whitespace_in_input_rejected() {
  assertThrows(
    () => TaggedUrn.fromString(' cap:in=media:;out=media:;test'),
    ErrorCodes.WHITESPACE_IN_INPUT,
    'Should reject leading whitespace'
  );
  assertThrows(
    () => TaggedUrn.fromString('cap:in=media:;out=media:;test '),
    ErrorCodes.WHITESPACE_IN_INPUT,
    'Should reject trailing whitespace'
  );
  assertThrows(
    () => TaggedUrn.fromString(' cap:in=media:;out=media:;test '),
    ErrorCodes.WHITESPACE_IN_INPUT,
    'Should reject leading and trailing whitespace'
  );
  assertThrows(
    () => TaggedUrn.fromString('\tcap:in=media:;out=media:;test'),
    ErrorCodes.WHITESPACE_IN_INPUT,
    'Should reject tab'
  );
  assertThrows(
    () => TaggedUrn.fromString('cap:in=media:;out=media:;test\n'),
    ErrorCodes.WHITESPACE_IN_INPUT,
    'Should reject newline'
  );

  const urn = TaggedUrn.fromString('cap:in=media:;out=media:;test');
  assert(urn.hasMarkerTag('test'), 'Clean input should work');
}

// ============================================================================
// SPECIAL VALUES ?, !, * (TEST567-TEST577)
// ============================================================================

// TEST567: All three input aliases (?x, x?, x=?) parse to stored
// value "?" and serialize as the canonical prefix form `?x`.
function test567_unspecified_question_mark_parsing() {
  const urn = TaggedUrn.fromString('cap:ext=?');
  assertConstraint(urn.getTag('ext'), Constraint.unconstrained(), 'Should parse ? as unspecified');
  assertEqual(urn.toString(), 'cap:?ext', 'Canonical of x=? is the prefix form ?x');
}

// TEST568: All three input aliases (!x, x!, x=!) parse to stored
// value "!" and serialize as the canonical prefix form `!x`.
function test568_must_not_have_exclamation_parsing() {
  const urn = TaggedUrn.fromString('cap:ext=!');
  assertConstraint(urn.getTag('ext'), Constraint.absent(), 'Should parse ! as must-not-have');
  assertEqual(urn.toString(), 'cap:!ext', 'Canonical of x=! is the prefix form !x');
}

// TEST569: Pattern with K=? matches any instance (with or without K)
function test569_question_mark_pattern_matches_anything() {
  const pattern = TaggedUrn.fromString('cap:ext=?');

  const instancePdf = TaggedUrn.fromString('cap:ext=pdf');
  const instanceDocx = TaggedUrn.fromString('cap:ext=docx');
  const instanceMissing = TaggedUrn.fromString('cap:');
  const instanceWildcard = TaggedUrn.fromString('cap:ext=*');
  const instanceMustNot = TaggedUrn.fromString('cap:ext=!');

  assert(instancePdf.conformsTo(pattern), 'ext=pdf should match ext=?');
  assert(instanceDocx.conformsTo(pattern), 'ext=docx should match ext=?');
  assert(instanceMissing.conformsTo(pattern), '(no ext) should match ext=?');
  assert(instanceWildcard.conformsTo(pattern), 'ext=* should match ext=?');
  assert(instanceMustNot.conformsTo(pattern), 'ext=! should match ext=?');
}

// TEST570: An instance with K=? promises nothing about K
//
// `?` is "no constraint", on either side. As an instance it used to satisfy
// every pattern ("whatever the pattern wants"), which made refinement
// non-transitive: missing ⪯ ?k ⪯ k=v, yet missing ⋠ k=v. It satisfies exactly
// the patterns that ask for nothing.
function test570_question_mark_in_instance() {
  const instance = TaggedUrn.fromString('cap:ext=?');

  const patternPdf = TaggedUrn.fromString('cap:ext=pdf');
  const patternWildcard = TaggedUrn.fromString('cap:ext=*');
  const patternMustNot = TaggedUrn.fromString('cap:ext=!');
  const patternQuestion = TaggedUrn.fromString('cap:ext=?');
  const patternMissing = TaggedUrn.fromString('cap:');

  assert(!instance.conformsTo(patternPdf), 'ext=? promises no pdf');
  assert(!instance.conformsTo(patternWildcard), 'ext=? promises no presence');
  assert(!instance.conformsTo(patternMustNot), 'ext=? promises no absence');
  assert(instance.conformsTo(patternQuestion), 'ext=? satisfies ext=?');
  assert(instance.conformsTo(patternMissing), 'ext=? satisfies (no ext)');
}

// TEST571: Pattern with K=! requires the instance to SAY K is absent
//
// A key an instance does not mention is not a promise that it is absent: as a
// pattern the same omission means "anything", and one form cannot mean two
// things. `media:pdf` used to satisfy `media:pdf;!compressed` while
// `media:pdf;compressed` satisfied `media:pdf` — and not the `!compressed`
// pattern — so refinement was not transitive.
function test571_must_not_have_pattern_requires_absent() {
  const pattern = TaggedUrn.fromString('cap:ext=!');

  const instanceMissing = TaggedUrn.fromString('cap:');
  const instancePdf = TaggedUrn.fromString('cap:ext=pdf');
  const instanceWildcard = TaggedUrn.fromString('cap:ext=*');
  const instanceMustNot = TaggedUrn.fromString('cap:ext=!');

  assert(!instanceMissing.conformsTo(pattern), '(no ext) does not promise ext is absent');
  assert(!instancePdf.conformsTo(pattern), 'ext=pdf should NOT match ext=!');
  assert(!instanceWildcard.conformsTo(pattern), 'ext=* should NOT match ext=!');
  assert(instanceMustNot.conformsTo(pattern), 'ext=! should match ext=!');
}

// TEST572: Instance with K=! conflicts with patterns requiring K
function test572_must_not_have_in_instance() {
  const instance = TaggedUrn.fromString('cap:ext=!');

  const patternPdf = TaggedUrn.fromString('cap:ext=pdf');
  const patternWildcard = TaggedUrn.fromString('cap:ext=*');
  const patternMustNot = TaggedUrn.fromString('cap:ext=!');
  const patternQuestion = TaggedUrn.fromString('cap:ext=?');
  const patternMissing = TaggedUrn.fromString('cap:');

  assert(!instance.conformsTo(patternPdf), 'ext=! should NOT match ext=pdf');
  assert(!instance.conformsTo(patternWildcard), 'ext=! should NOT match ext=*');
  assert(instance.conformsTo(patternMustNot), 'ext=! should match ext=!');
  assert(instance.conformsTo(patternQuestion), 'ext=! should match ext=?');
  assert(instance.conformsTo(patternMissing), 'ext=! should match (no ext)');
}

// TEST573: Comprehensive test of all instance/pattern combinations
//
// Each form means the set of states it allows, on either side, and an instance
// satisfies a pattern when its set is inside the pattern's (capdag/formal,
// `tagMatch_iff_allows`).
function test573_full_cross_product_matching() {
  function check(instanceStr, patternStr, expected, msg) {
    const inst = TaggedUrn.fromString(instanceStr);
    const patt = TaggedUrn.fromString(patternStr);
    const result = inst.conformsTo(patt);
    if (result !== expected) {
      throw new Error(`Cross-product failed: ${msg}: instance=${instanceStr}, pattern=${patternStr}, expected=${expected}, got=${result}`);
    }
  }

  // Instance missing, Pattern variations
  check('cap:', 'cap:', true, '(none)/(none)');
  check('cap:', 'cap:k=?', true, '(none)/K=?');
  check('cap:', 'cap:k=!', false, '(none)/K=!');
  check('cap:', 'cap:k', false, '(none)/K=*');
  check('cap:', 'cap:k=v', false, '(none)/K=v');

  // Instance K=?, Pattern variations
  check('cap:k=?', 'cap:', true, 'K=?/(none)');
  check('cap:k=?', 'cap:k=?', true, 'K=?/K=?');
  check('cap:k=?', 'cap:k=!', false, 'K=?/K=!');
  check('cap:k=?', 'cap:k', false, 'K=?/K=*');
  check('cap:k=?', 'cap:k=v', false, 'K=?/K=v');

  // Instance K=!, Pattern variations
  check('cap:k=!', 'cap:', true, 'K=!/(none)');
  check('cap:k=!', 'cap:k=?', true, 'K=!/K=?');
  check('cap:k=!', 'cap:k=!', true, 'K=!/K=!');
  check('cap:k=!', 'cap:k', false, 'K=!/K=*');
  check('cap:k=!', 'cap:k=v', false, 'K=!/K=v');

  // Instance K=*, Pattern variations
  check('cap:k', 'cap:', true, 'K=*/(none)');
  check('cap:k', 'cap:k=?', true, 'K=*/K=?');
  check('cap:k', 'cap:k=!', false, 'K=*/K=!');
  check('cap:k', 'cap:k', true, 'K=*/K=*');
  check('cap:k', 'cap:k=v', false, 'K=*/K=v');

  // Instance K=v, Pattern variations
  check('cap:k=v', 'cap:', true, 'K=v/(none)');
  check('cap:k=v', 'cap:k=?', true, 'K=v/K=?');
  check('cap:k=v', 'cap:k=!', false, 'K=v/K=!');
  check('cap:k=v', 'cap:k', true, 'K=v/K=*');
  check('cap:k=v', 'cap:k=v', true, 'K=v/K=v');
  check('cap:k=v', 'cap:k=w', false, 'K=v/K=w');
}

// TEST574: URNs with multiple special values work correctly
function test574_mixed_special_values() {
  const pattern = TaggedUrn.fromString('cap:required;optional=?;forbidden=!;exact=pdf');

  // Instance that satisfies all constraints — including stating that the
  // forbidden key is absent, which leaving it out does not promise.
  const goodInstance = TaggedUrn.fromString('cap:required=yes;optional=maybe;forbidden=!;exact=pdf');
  const silentOnForbidden = TaggedUrn.fromString('cap:required=yes;optional=maybe;exact=pdf');
  assert(!silentOnForbidden.conformsTo(pattern), 'saying nothing about forbidden is not saying it is absent');
  assert(goodInstance.conformsTo(pattern), 'Good instance should match');

  // Instance missing required tag
  const missingRequired = TaggedUrn.fromString('cap:optional=maybe;exact=pdf');
  assert(!missingRequired.conformsTo(pattern), 'Missing required should not match');

  // Instance has forbidden tag
  const hasForbidden = TaggedUrn.fromString('cap:required=yes;forbidden=oops;exact=pdf');
  assert(!hasForbidden.conformsTo(pattern), 'Having forbidden tag should not match');

  // Instance with wrong exact value
  const wrongExact = TaggedUrn.fromString('cap:required=yes;exact=doc');
  assert(!wrongExact.conformsTo(pattern), 'Wrong exact value should not match');
}

// TEST575: All special values round-trip correctly
function test575_serialization_round_trip_special_values() {
  const originals = [
    'cap:ext=?',
    'cap:ext=!',
    'cap:ext',  // * serializes as valueless
    'cap:a=?;b=!;c;d=exact',
  ];

  for (const original of originals) {
    const urn = TaggedUrn.fromString(original);
    const serialized = urn.toString();
    const reparsed = TaggedUrn.fromString(serialized);
    assert(urn.equals(reparsed), `Round-trip failed for: ${original}`);
  }
}

// TEST576: Bidirectional accepts with special values
function test576_compatibility_with_special_values() {
  const mustNot = TaggedUrn.fromString('cap:ext=!');
  const mustHave = TaggedUrn.fromString('cap:ext=*');
  const specific = TaggedUrn.fromString('cap:ext=pdf');
  const unspecified = TaggedUrn.fromString('cap:ext=?');
  const missing = TaggedUrn.fromString('cap:');

  // ! neither accepts nor is accepted by * or specific
  assert(!mustNot.accepts(mustHave) && !mustHave.accepts(mustNot), '! and * do not accept each other');
  assert(!mustNot.accepts(specific) && !specific.accepts(mustNot), '! and specific do not accept each other');
  // ! accepted by ? (unspecified accepts anything)
  assert(unspecified.accepts(mustNot), '? accepts !');
  assert(!mustNot.accepts(unspecified), '! does not accept ?: ? promises nothing about absence');
  // ! and missing: missing pattern has no constraint
  assert(missing.accepts(mustNot), 'empty pattern accepts !');
  // ! and !: mutual acceptance
  assert(mustNot.accepts(mustNot), '! accepts !');

  // * accepts specific
  assert(mustHave.accepts(specific), '* accepts specific');
  // * accepts *
  assert(mustHave.accepts(mustHave), '* accepts *');

  // ? accepts everything
  assert(unspecified.accepts(mustNot), '? accepts !');
  assert(unspecified.accepts(mustHave), '? accepts *');
  assert(unspecified.accepts(specific), '? accepts specific');
  assert(unspecified.accepts(unspecified), '? accepts ?');
  assert(unspecified.accepts(missing), '? accepts missing');
}

// TEST577: Verify graded specificity with the six-form ladder.
//   ?x=0, x?=v=1, x=*=2, x!=v=3, x=v=4, !x=5
function test577_specificity_with_special_values() {
  const exact = TaggedUrn.fromString('cap:a=x;b=y;c=z');     // 3 * 4 = 12
  const mustHave = TaggedUrn.fromString('cap:a;b;c');         // 3 * 2 = 6
  const mustNot = TaggedUrn.fromString('cap:!a;!b;!c');       // 3 * 5 = 15
  const unspecified = TaggedUrn.fromString('cap:?a;?b;?c');   // 3 * 0 = 0
  // mixed: a=x (4) + b (2) + !c (5) + ?d (0) = 11
  const mixed = TaggedUrn.fromString('cap:!c;?d;a=x;b');

  assertEqual(exact.specificity(), 12, '3 exact = 12');
  assertEqual(mustHave.specificity(), 6, '3 must-have = 6');
  assertEqual(mustNot.specificity(), 15, '3 must-not = 15');
  assertEqual(unspecified.specificity(), 0, '3 unspecified = 0');
  assertEqual(mixed.specificity(), 11, 'mixed = 11');

  // Five-tuple counts: (must_not_have, exact, present_not_value,
  // must_have_any, absent_or_not_value).
  assertDeepEqual(exact.specificityTuple(), [0, 3, 0, 0, 0], 'exact tuple');
  assertDeepEqual(mustHave.specificityTuple(), [0, 0, 0, 3, 0], 'mustHave tuple');
  assertDeepEqual(mustNot.specificityTuple(), [3, 0, 0, 0, 0], 'mustNot tuple');
  assertDeepEqual(unspecified.specificityTuple(), [0, 0, 0, 0, 0], 'unspecified tuple');
  assertDeepEqual(mixed.specificityTuple(), [1, 1, 0, 1, 0], 'mixed tuple');
}

// TEST7223: A URN read back from its model handle is the URN: its prefix and every
// tag, each form and a quoted value included.
function test7223_urn_read_back_from_its_handle() {
  for (const text of ['media:!a;?b;c?=v;d;e=v;f!=v;g="x y"', 'cap:', 'media:pdf']) {
    const urn = TaggedUrn.fromString(text);
    const back = TaggedUrn.fromFormal(urn.formal);
    assertEqual(back.getPrefix(), urn.getPrefix(), `prefix of ${text}`);
    assertDeepEqual(back.tags, urn.tags, `tags of ${text}`);
    assert(back.equals(urn), `${text} reads back as itself`);
  }
}

// TEST7210: A written tag lets its key be absent exactly when it is !k, ?k or k?=v;
// a key the URN does not mention says nothing of it, so it allows absence too.
function test7210_admits_absence_by_form() {
  const urn = TaggedUrn.fromString('media:!a;?b;c?=v;d;e=v;f!=v');
  assert(urn.admitsAbsence('a'), '!a admits absence');
  assert(urn.admitsAbsence('b'), '?b admits absence');
  assert(urn.admitsAbsence('c'), 'c?=v admits absence');
  assert(!urn.admitsAbsence('d'), 'd does not admit absence');
  assert(!urn.admitsAbsence('e'), 'e=v does not admit absence');
  assert(!urn.admitsAbsence('f'), 'f!=v does not admit absence');
  assert(urn.admitsAbsence('g'), 'an unmentioned key admits absence');
  // Keys are read as the URN stores them: lowercase.
  assert(urn.admitsAbsence('A'), 'keys are lowercased');
}

// ============================================================================
// JS-ONLY TESTS (no Rust equivalent)
// ============================================================================

// JS-only: Test marker tags are authored without an `action` key
function test0001_JsOnly_op_tag_rename() {
  const cap = TaggedUrn.fromString('cap:generate;format=json');
  assert(cap.hasMarkerTag('generate'), 'Should have generate marker');
  assertEqual(cap.getTag('action'), undefined, 'Should not have action tag');

  const built = new TaggedUrnBuilder('cap')
    .marker('transform')
    .tag('type', 'data')
    .build();
  assert(built.hasMarkerTag('transform'), 'Builder should set transform marker');
}

// ============================================================================
// CONVENIENCE METHOD TESTS (conformsToStr, acceptsStr, canonical)
// ============================================================================

// Test conformsToStr convenience method
function test0002_ConformsToStr() {
  const urn = TaggedUrn.fromString('cap:generate;ext=pdf');
  // Pattern asks for the `generate` marker; instance has it (plus ext=pdf).
  assert(urn.conformsToStr('cap:generate'), 'Should match subset pattern string');
  // Pattern asks for the `extract` marker; instance has `generate`, not `extract`.
  assert(!urn.conformsToStr('cap:extract'), 'Should not match conflicting pattern string');
}

// Test acceptsStr convenience method
function test0003_AcceptsStr() {
  const pattern = TaggedUrn.fromString('cap:generate');
  // Instance has the required `generate` marker plus an extra ext=pdf tag.
  assert(pattern.acceptsStr('cap:generate;ext=pdf'), 'Should accept more specific instance string');
  // Instance lacks the required `generate` marker.
  assert(!pattern.acceptsStr('cap:extract'), 'Should not accept conflicting instance string');
}

// Test canonical static method
function test0004_Canonical() {
  assertEqual(
    TaggedUrn.canonical('cap:generate;ext=pdf;target=thumbnail'),
    'cap:ext=pdf;generate;target=thumbnail',
    'Should return canonical form'
  );
}

// Test canonicalOption static method
function test0005_CanonicalOption() {
  assertEqual(
    TaggedUrn.canonicalOption('cap:generate;ext=pdf'),
    'cap:ext=pdf;generate',
    'Should return canonical form for valid input'
  );
  assertEqual(TaggedUrn.canonicalOption(null), null, 'Should return null for null');
  assertEqual(TaggedUrn.canonicalOption(undefined), null, 'Should return null for undefined');
}

// ============================================================================
// TEST RUNNER
// ============================================================================

// TEST600: every function of the proved model this mirror calls carries a proved claim.
//
// The model's package carries what is proved of each function it exports (its assurance
// document, generated from ../formal): each one decides, equals or keeps what its claim says,
// and none rests on an assumption about the host — the model needs none.
function test600_every_model_function_carries_a_proved_claim() {
  assertEqual(ASSURANCE.facilities.length, 0, 'the model assumes nothing of the host');
  assertEqual(ASSURANCE.assumptions.length, 0, 'no assumptions');
  assert(ASSURANCE.exports.length > 0, 'the model exports functions');
  for (const e of ASSURANCE.exports) {
    assert(e.claims.length > 0, `${e.name} carries no claim`);
    assertEqual(e.assumptions.length, 0, `${e.name} rests on an assumption`);
    for (const name of e.claims) {
      const claim = ASSURANCE.claims.find((c) => c.name === name);
      assertEqual(claim.status, 'proved', name);
      assert(claim.subjects.includes(e.name), `${name} is about ${e.name}`);
    }
  }
  const refines = ASSURANCE.claims.find((c) => c.name === 'TaggedUrn.Exec.refines_decides');
  assertDeepEqual([refines.relation, refines.specifications], ['lungo.decides', ['TaggedUrn.refines']], 'refines decides');
}

// TEST599: every row of the proved model's table.
//
// The rules are proved in ../formal (Lean); this ties them to this mirror:
// every row of ../formal/conformance.json (written by the model,
// `lake exe conformance`) is parsed by this parser and must get the model's
// verdict, and every set of URNs in it the model's bound (leastUpperBound).
// The same table runs in every mirror.
function test599_every_row_of_the_models_table() {
  const table = JSON.parse(readFileSync(new URL('../formal/conformance.json', import.meta.url), 'utf8'));
  const wrong = [];
  for (const row of table.refines) {
    const a = TaggedUrn.fromString(row.instance);
    const b = TaggedUrn.fromString(row.pattern);
    if (a.conformsTo(b) !== row.refines) wrong.push(`${row.instance} ⪯ ${row.pattern}: model ${row.refines}`);
    if (a.isEquivalent(b) !== row.equivalent) wrong.push(`${row.instance} ≡ ${row.pattern}: model ${row.equivalent}`);
    for (const [name, got, model] of [
      ['meets', a.meets(b), row.meets],
      ['satisfies', a.satisfies(b), row.satisfies],
      ['may satisfy', a.maySatisfy(b), row.may_satisfy],
    ]) {
      if (got !== model) wrong.push(`${row.instance} ${name} ${row.pattern}: model ${model}`);
    }
  }
  for (const row of table.scores) {
    if (TaggedUrn.fromString(row.urn).specificity() !== row.score) wrong.push(`specificity ${row.urn}: model ${row.score}`);
  }
  for (const row of table.bounds) {
    const bound = TaggedUrn.leastUpperBound('media', row.urns.map((u) => TaggedUrn.fromString(u)));
    if (!bound.equals(TaggedUrn.fromString(row.bound))) {
      wrong.push(`bound of [${row.urns.join(', ')}]: ${bound.toString()}, model ${row.bound}`);
    }
  }
  assert(table.refines.length > 4000 && table.scores.length > 60 && table.bounds.length > 5000,
    'the table is the full one');
  assert(wrong.length === 0, `${wrong.length} answer(s) differ from the model, e.g. ${wrong.slice(0, 8).join('; ')}`);
}

// TEST392: the bound of several URNs: the values they share, a key every one sets to differing values as "some value", the coarser of two comparable URNs, nothing for none, and another prefix refused
function test392_least_upper_bound() {
  const bound = (...urns) => TaggedUrn.leastUpperBound('media', urns.map((u) => TaggedUrn.fromString(u)));
  const is = (urn, expected) => assert(urn.equals(TaggedUrn.fromString(expected)), `${urn.toString()} should be ${expected}`);

  is(bound('media:ext=png;image', 'media:ext=jpeg;image'), 'media:ext;image');
  // One input already holds the other: the bound is that input, not the wider `ext`.
  is(bound('media:ext=png', 'media:ext!=pdf'), 'media:ext!=pdf');
  // A key one input omits says nothing there, so the bound says nothing either.
  is(bound('media:ext=png;image', 'media:image'), 'media:image');
  is(bound(), 'media:');

  assertThrows(
    () => bound('media:image', 'cap:image'),
    ErrorCodes.PREFIX_MISMATCH,
    'Should throw PREFIX_MISMATCH when bounding URNs with different prefixes'
  );
}

// =========================================================================
// ORDER-THEORETIC RELATIONS & BUILDER TESTS (TEST578-598)
// =========================================================================

// TEST578: Equivalent URNs with identical tag sets
function test578_equivalent_identical_tags() {
  const a = TaggedUrn.fromString('cap:ext=pdf;generate;in=media:;out=media:');
  const b = TaggedUrn.fromString('cap:ext=pdf;generate;in=media:;out=media:');
  assert(a.isEquivalent(b), 'Equivalent should be true');
  assert(b.isEquivalent(a), 'Equivalent should be symmetric');
}

// TEST579: Non-equivalent URNs where one is more specific
function test579_not_equivalent_when_one_more_specific() {
  const general = TaggedUrn.fromString('media:');
  const specific = TaggedUrn.fromString('media:pdf');
  assert(!general.isEquivalent(specific), 'Should not be equivalent');
  assert(!specific.isEquivalent(general), 'Should not be equivalent (reverse)');
}

// TEST580: Comparable URNs on the same specialization chain
function test580_comparable_specialization_chain() {
  const general = TaggedUrn.fromString('media:');
  const specific = TaggedUrn.fromString('media:pdf');
  assert(general.isComparable(specific), 'Should be comparable');
  assert(specific.isComparable(general), 'Should be comparable (symmetric)');
}

// TEST581: Incomparable URNs in different branches of the lattice
function test581_incomparable_different_branches() {
  const pdf = TaggedUrn.fromString('media:pdf');
  const txt = TaggedUrn.fromString('media:enc=utf-8;txt');
  assert(!pdf.isComparable(txt), 'Should not be comparable');
  assert(!txt.isComparable(pdf), 'Should not be comparable (reverse)');
}

// TEST582: Equivalent implies comparable but not vice versa
function test582_equivalent_implies_comparable() {
  const a = TaggedUrn.fromString('cap:ext=pdf;in=media:;out=media:;test');
  const b = TaggedUrn.fromString('cap:ext=pdf;in=media:;out=media:;test');
  assert(a.isEquivalent(b), 'Should be equivalent');
  assert(a.isComparable(b), 'Equivalent implies comparable');

  const general = TaggedUrn.fromString('cap:in=media:;out=media:;test');
  const specific = TaggedUrn.fromString('cap:ext=pdf;in=media:;out=media:;test');
  assert(!general.isEquivalent(specific), 'Comparable need not be equivalent');
  assert(general.isComparable(specific), 'General and specific are comparable');
}

// TEST583: Prefix mismatch returns error for both relations
function test583_prefix_mismatch_errors() {
  const cap = TaggedUrn.fromString('cap:in=media:;out=media:;test');
  const media = TaggedUrn.fromString('media:');
  assertThrows(() => cap.isEquivalent(media), ErrorCodes.PREFIX_MISMATCH, 'isEquivalent across prefixes');
  assertThrows(() => cap.isComparable(media), ErrorCodes.PREFIX_MISMATCH, 'isComparable across prefixes');
}

// TEST584: Empty tag set is comparable to everything with same prefix
function test584_empty_tags_comparable_to_all() {
  const empty = TaggedUrn.fromString('media:');
  const specific = TaggedUrn.fromString('media:pdf;thumbnail');
  assert(empty.isComparable(specific), 'Empty is comparable to everything');
  assert(!empty.isEquivalent(specific), 'Empty is not equivalent to a tagged URN');
  assert(empty.isEquivalent(TaggedUrn.fromString('media:')), 'Empty is equivalent to itself');
}

// TEST585: String variants of isEquivalent and isComparable
function test585_string_variants() {
  const urn = TaggedUrn.fromString('media:pdf');
  assert(urn.isEquivalentStr('media:pdf'), 'Same tags are equivalent');
  assert(!urn.isEquivalentStr('media:'), 'Different tags are not equivalent');
  assert(urn.isComparableStr('media:'), 'On the same chain');
  assert(!urn.isComparableStr('media:enc=utf-8;txt'), 'Different branch');
}

// TEST586: Special values (*, !, ?) with isEquivalent and isComparable
function test586_special_values() {
  const mustHave = TaggedUrn.fromString('cap:ext');
  const exact = TaggedUrn.fromString('cap:ext=pdf');
  const mustNot = TaggedUrn.fromString('cap:ext=!');
  const unspecified = TaggedUrn.fromString('cap:ext=?');

  assert(!mustHave.isEquivalent(exact), 'Marker and exact are not equivalent');
  assert(mustHave.isComparable(exact), 'A pdf is some ext');

  assert(!mustNot.isComparable(exact), 'Absent and exact conflict');
  assert(!mustNot.isEquivalent(exact), 'Absent and exact are not equivalent');
  assert(!mustNot.isComparable(mustHave), 'Absent and present conflict');
  assert(!mustNot.isEquivalent(mustHave), 'Absent and present are not equivalent');

  assert(!unspecified.isEquivalent(exact), 'Unconstrained is not exact');
  assert(!unspecified.isEquivalent(mustHave), 'Unconstrained is not present');
  assert(!unspecified.isEquivalent(mustNot), 'Unconstrained is not absent');
  assert(unspecified.isComparable(exact), 'Unconstrained accepts exact');
  assert(unspecified.isComparable(mustNot), 'Unconstrained accepts absent');
  assert(unspecified.isEquivalent(TaggedUrn.fromString('cap:')), 'Unconstrained is the empty URN');
}

// TEST587: Builder fluent API for tag manipulation
function test587_builder_fluent_api() {
  const urn = new TaggedUrnBuilder('cap')
    .marker('generate')
    .tag('target', 'thumbnail')
    .tag('format', 'pdf')
    .tag('output', 'binary')
    .build();
  assert(urn.hasMarkerTag('generate'), 'generate marker');
  assertConstraint(urn.getTag('target'), Constraint.exact('thumbnail'), 'target tag');
  assertConstraint(urn.getTag('format'), Constraint.exact('pdf'), 'format tag');
  assertConstraint(urn.getTag('output'), Constraint.exact('binary'), 'output tag');
}

// TEST588: Builder with custom tags
function test588_builder_custom_tags() {
  const urn = new TaggedUrnBuilder('cap')
    .tag('engine', 'v2')
    .tag('quality', 'high')
    .marker('compress')
    .build();
  assertConstraint(urn.getTag('engine'), Constraint.exact('v2'), 'engine tag');
  assertConstraint(urn.getTag('quality'), Constraint.exact('high'), 'quality tag');
  assert(urn.hasMarkerTag('compress'), 'compress marker');
}

// TEST589: Builder tag overrides (last value wins)
function test589_builder_tag_overrides() {
  const urn = new TaggedUrnBuilder('cap')
    .marker('convert')
    .tag('format', 'jpg')
    .build();
  assert(urn.hasMarkerTag('convert'), 'convert marker');
  assertConstraint(urn.getTag('format'), Constraint.exact('jpg'), 'format tag');
}

// TEST590: Builder empty build returns error (tags required)
function test590_builder_empty_build() {
  assertThrows(() => new TaggedUrnBuilder('cap').build(), ErrorCodes.INVALID_FORMAT, 'Empty builder should error');
}

// TEST591: Builder with single tag
function test591_builder_single_tag() {
  const urn = new TaggedUrnBuilder('cap').tag('type', 'utility').build();
  assertEqual(urn.toString(), 'cap:type=utility', 'toString');
  assertConstraint(urn.getTag('type'), Constraint.exact('utility'), 'type tag');
  assertEqual(urn.specificity(), 4, 'An exact value scores 4');
}

// TEST592: Builder with complex multi-tag URN
function test592_builder_complex() {
  const urn = new TaggedUrnBuilder('cap')
    .tag('type', 'media')
    .marker('transcode')
    .tag('target', 'video')
    .tag('format', 'mp4')
    .tag('codec', 'h264')
    .tag('quality', '1080p')
    .tag('framerate', '30fps')
    .tag('output', 'binary')
    .build();
  assertConstraint(urn.getTag('type'), Constraint.exact('media'), 'type tag');
  assert(urn.hasMarkerTag('transcode'), 'transcode marker');
  assertConstraint(urn.getTag('target'), Constraint.exact('video'), 'target tag');
  assertConstraint(urn.getTag('format'), Constraint.exact('mp4'), 'format tag');
  assertConstraint(urn.getTag('codec'), Constraint.exact('h264'), 'codec tag');
  assertConstraint(urn.getTag('quality'), Constraint.exact('1080p'), 'quality tag');
  assertConstraint(urn.getTag('framerate'), Constraint.exact('30fps'), 'framerate tag');
  assertConstraint(urn.getTag('output'), Constraint.exact('binary'), 'output tag');
  // 7 exact values × 4 + 1 marker × 2
  assertEqual(urn.specificity(), 30, 'specificity');
}

// TEST593: Builder with wildcards
function test593_builder_wildcards() {
  const urn = new TaggedUrnBuilder('cap')
    .marker('convert')
    .marker('ext')
    .marker('quality')
    .build();
  assertEqual(urn.toString(), 'cap:convert;ext;quality', 'Markers serialize value-less, sorted');
  assertEqual(urn.specificity(), 6, '3 markers × 2');
  assert(urn.hasMarkerTag('convert'), 'convert marker');
  assert(urn.hasMarkerTag('ext'), 'ext marker');
  assert(urn.hasMarkerTag('quality'), 'quality marker');
}

// TEST594: Builder with custom prefix
function test594_builder_custom_prefix() {
  const urn = new TaggedUrnBuilder('myapp').tag('key', 'value').build();
  assertEqual(urn.prefix, 'myapp', 'prefix');
  assertEqual(urn.toString(), 'myapp:key=value', 'toString');
}

// TEST595: Builder matching with built URN
function test595_builder_matching_with_built_urn() {
  const specificInstance = new TaggedUrnBuilder('cap')
    .tag('op', 'generate')
    .tag('target', 'thumbnail')
    .tag('format', 'pdf')
    .build();
  const generalPattern = new TaggedUrnBuilder('cap').tag('op', 'generate').build();
  const wildcardPattern = new TaggedUrnBuilder('cap')
    .tag('op', 'generate')
    .tag('target', 'thumbnail')
    .marker('ext')
    .build();

  assert(specificInstance.conformsTo(generalPattern), 'Should conform to general');
  assert(!specificInstance.conformsTo(wildcardPattern), 'Should not conform to a pattern that requires ext');
  assert(specificInstance.isMoreSpecificThan(generalPattern), 'Specific is more specific');
  assertEqual(specificInstance.specificity(), 12, '3 exact × 4');
  assertEqual(generalPattern.specificity(), 4, '1 exact × 4');
  assertEqual(wildcardPattern.specificity(), 10, '2 exact × 4 + 1 marker × 2');
}

// TEST596: Empty delta preserves a more specific concrete instance.
function test596_empty_delta_preserves_refinement() {
  const base = TaggedUrn.fromString('media:');
  const target = TaggedUrn.fromString('media:');
  const runtime = TaggedUrn.fromString('media:image;png');
  const delta = target.deltaFrom(base);
  assertEqual(delta.relationKind, TaggedUrnRelationKind.EQUIVALENT, 'empty delta should be equivalent');
  assert(delta.isEmpty(), 'empty delta should have no edits');
  assertEqual(runtime.applyDelta(delta).toString(), 'media:image;png', 'empty delta should preserve runtime refinement');
}

// TEST597: Incomparable replacement rewrites only declared coordinates.
function test597_incomparable_replacement() {
  const base = TaggedUrn.fromString('media:enc=utf-8;markdown');
  const target = TaggedUrn.fromString('media:enc=utf-8;html');
  const runtime = TaggedUrn.fromString('media:enc=utf-8;lang=en;markdown');
  const delta = target.deltaFrom(base);
  assertEqual(delta.relationKind, TaggedUrnRelationKind.INCOMPARABLE, 'markdown -> html should be incomparable');
  assertEqual(runtime.applyDelta(delta).toString(), 'media:enc=utf-8;html;lang=en', 'unrelated runtime refinements must be preserved');
}

// TEST598: Comparable removal drops only the declared key.
function test598_comparable_removal() {
  const base = TaggedUrn.fromString('media:image;png');
  const target = TaggedUrn.fromString('media:image');
  const runtime = TaggedUrn.fromString('media:author=me;image;png');
  const delta = target.deltaFrom(base);
  assertEqual(delta.relationKind, TaggedUrnRelationKind.COMPARABLE, 'image;png -> image should be comparable');
  assertEqual(runtime.applyDelta(delta).toString(), 'media:author=me;image', 'only the declared key should be removed');
}

// =========================================================================
// TEXT GRAMMAR (TEST6752-TEST6756)
// =========================================================================

function assertCode(fn, code, message) {
  assertThrows(fn, code, message);
}

// TEST6752: An unquoted value that begins with ? or ! is that qualifier (x=?v is x?=v, x=!v is x!=v); a quoted one is literal
function test6752_qualifier_value_alias() {
  const p = (s) => TaggedUrn.fromString(s);
  assert(p('t:x=?v').equals(p('t:x?=v')), 'x=?v is x?=v');
  assertEqual(p('t:x=?v').toString(), 't:x?=v', 'x=?v prints x?=v');
  assertConstraint(p('t:x=?v').getTag('x'), Constraint.optionalNot('v'), 'x=?v is optionalNot v');
  assert(p('t:x=!v').equals(p('t:x!=v')), 'x=!v is x!=v');
  assertEqual(p('t:x=!v').toString(), 't:x!=v', 'x=!v prints x!=v');
  assertConstraint(p('t:x=!v').getTag('x'), Constraint.presentNot('v'), 'x=!v is presentNot v');

  for (const refused of ['t:x=?*', 't:x=!?', 't:x=??', 't:x=?!', 't:x=!*', 't:?x=?v', 't:x!=!v']) {
    assertCode(() => p(refused), ErrorCodes.INVALID_CHARACTER, `${refused} must be refused`);
  }

  assertEqual(p('t:x=?').toString(), 't:?x', 'x=? prints ?x');
  assertEqual(p('t:x=!').toString(), 't:!x', 'x=! prints !x');

  const literal = p('t:x="?v"');
  assertConstraint(literal.getTag('x'), Constraint.exact('?v'), 'quoted ?v is exact');
  assertEqual(literal.toString(), 't:x="?v"', 'exact ?v prints quoted');
  assert(p(literal.toString()).equals(literal), 'exact ?v reads back');
  assert(!literal.equals(p('t:x?=v')), 'exact ?v is not x?=v');
}

// TEST6753: The prefix and every key are identifiers (an ASCII letter, then ASCII letters, digits and -), lowered, in parsing and in every constructor
function test6753_prefix_and_key_are_identifiers() {
  for (const refused of ['t:a_b=1', 't:a.b=1', 't:a/b=1', 't:a:b=1', 't:1a=1', 't:é=1', 'my_app:x', '1t:x', 'é:x']) {
    assertCode(() => TaggedUrn.fromString(refused), ErrorCodes.INVALID_CHARACTER, `${refused} must be refused`);
  }

  const urn = TaggedUrn.fromString('T:A-b1=v');
  assertEqual(urn.prefix, 't', 'prefix lowered');
  assertConstraint(urn.getTag('a-b1'), Constraint.exact('v'), 'key lowered');

  assertCode(() => new TaggedUrn('t', { a_b: Constraint.exact('v') }), ErrorCodes.INVALID_CHARACTER, 'constructor key');
  assertCode(() => TaggedUrn.empty('my_app'), ErrorCodes.INVALID_CHARACTER, 'empty prefix');
  assertCode(() => new TaggedUrnBuilder('1t'), ErrorCodes.INVALID_CHARACTER, 'builder prefix');
  assertCode(() => new TaggedUrnBuilder('t').tag('a.b', 'v'), ErrorCodes.INVALID_CHARACTER, 'builder key');
  assertCode(() => TaggedUrn.empty('t').withTag('a/b', Constraint.exact('v')), ErrorCodes.INVALID_CHARACTER, 'withTag key');
  assertCode(() => TaggedUrn.leastUpperBound('a:b', []), ErrorCodes.INVALID_CHARACTER, 'bound prefix');

  const built = new TaggedUrnBuilder('T').tag('Key-2', 'v').build();
  assert(built.equals(TaggedUrn.fromString('t:key-2=v')), 'builder lowers prefix and key');
}

/** `value` written as a quoted literal: `"`, with `"` and `\` escaped. */
function quotedLiteral(value) {
  let out = '"';
  for (const c of value) {
    out += (c === '"' || c === '\\') ? `\\${c}` : c;
  }
  return out + '"';
}

// TEST6754: Every value a URN holds prints so that it reads back as itself
function test6754_every_value_reads_back() {
  for (const value of ['a,b', 'a(b)', 'x@y#z', 'a\tb', 'Été', 'a b', 'a;b', 'a=b', 'q"q', 'b\\s', 'plain', '?v',
    '!v', '*', '?', '!', '*v']) {
    const urn = TaggedUrn.fromString(`t:k=${quotedLiteral(value)}`);
    assertConstraint(urn.getTag('k'), Constraint.exact(value), `stored value of ${JSON.stringify(value)}`);
    const printed = urn.toString();
    const reparsed = TaggedUrn.fromString(printed);
    assert(reparsed.equals(urn), `${JSON.stringify(value)} printed as ${printed} reads back`);
    assertConstraint(reparsed.getTag('k'), Constraint.exact(value), `reread value of ${JSON.stringify(value)}`);
    // writeValue writes the value as the URN prints it.
    assertEqual(printed, `t:k=${TaggedUrn.writeValue(value)}`, `writeValue of ${JSON.stringify(value)}`);
  }
}

// TEST6755: An unquoted value takes any character but ; = " \ and whitespace
function test6755_unquoted_value_takes_any_non_separator() {
  const urn = TaggedUrn.fromString('t:k=a,b(c)');
  assertConstraint(urn.getTag('k'), Constraint.exact('a,b(c)'), 'commas and parentheses stand bare');

  const symbols = TaggedUrn.fromString("t:k=x@y#z+%&~'[]{}<>^$|");
  assertConstraint(symbols.getTag('k'), Constraint.exact("x@y#z+%&~'[]{}<>^$|"), 'symbols stand bare');

  assertConstraint(TaggedUrn.fromString('t:k=A,B').getTag('k'), Constraint.exact('a,b'), 'bare values are lowered');

  assertCode(() => TaggedUrn.fromString('t:k=a\tb'), ErrorCodes.INVALID_CHARACTER, 'a tab is refused bare');

  for (const u of [urn, symbols]) {
    assert(TaggedUrn.fromString(u.toString()).equals(u), `${u.toString()} reads back`);
  }
}

// TEST6756: A quoted value is the literal value: a quoted *, ? or ! is never a sigil, and a quoted ?=v is never a qualifier
function test6756_quoted_value_is_literal() {
  const p = (s) => TaggedUrn.fromString(s);
  const star = p('t:x="*"');
  assertConstraint(star.getTag('x'), Constraint.exact('*'), 'quoted * is exact');
  assert(!star.equals(p('t:x')), 'exact * is not the marker');
  assertEqual(star.toString(), 't:x="*"', 'exact * prints quoted');
  assert(p(star.toString()).equals(star), 'exact * reads back');
  assert(star.conformsTo(p('t:x')), 'exact * is some x');
  assert(!p('t:x').conformsTo(star), 'some x is not exactly *');

  const question = p('t:x="?"');
  assertConstraint(question.getTag('x'), Constraint.exact('?'), 'quoted ? is exact');
  assert(!question.isEquivalent(p('t:?x')), 'exact ? is not unconstrained');

  assertConstraint(p('t:x="!"').getTag('x'), Constraint.exact('!'), 'quoted ! is exact');
  assertConstraint(p('t:x="?=v"').getTag('x'), Constraint.exact('?=v'), 'quoted ?=v is exact');

  const optional = p('t:?x="*"');
  assertConstraint(optional.getTag('x'), Constraint.optionalNot('*'), '?x="*" is optionalNot *');
  assertEqual(optional.toString(), 't:x?="*"', 'optionalNot * prints quoted');
  assert(p(optional.toString()).equals(optional), 'optionalNot * reads back');

  assert(new TaggedUrnBuilder('t').tag('x', '*').build().equals(star), "the builder's exact value is literal");
}

// TEST7241: URNs are ordered by their parts, never their text: the prefix, then each tag in key order by key, then by its constraint's form (unconstrained, optionalNot, present, presentNot, exact, absent), then by its value
function test7241_urns_are_ordered_by_their_parts() {
  const p = (s) => TaggedUrn.fromString(s);
  const before = (a, b) => {
    assert(p(a).compare(p(b)) < 0, `${a} stands before ${b}`);
    assert(p(b).compare(p(a)) > 0, `${b} stands after ${a}`);
  };

  // The text orders file-path first; the parts order file first.
  assert(p('t:file-path').toString() < p('t:file;sample').toString(), 'the text orders file-path first');
  before('t:file;sample', 't:file-path');
  // The prefix decides first.
  before('b:z', 'c:a');
  // A URN whose tags are the beginning of another's stands first.
  before('t:file', 't:file;sample');
  // One key, each form in the truth table's order.
  const forms = ['t:?x', 't:x?=v', 't:x', 't:x!=v', 't:x=v', 't:!x'];
  for (let i = 0; i + 1 < forms.length; i++) {
    before(forms[i], forms[i + 1]);
  }
  // One form, values in their own order; a quoted value is a value.
  before('t:x=ascii', 't:x=utf8');
  before('t:x="*"', 't:x=a');
  before('t:x?=a', 't:x?=b');
  // Writing order is no part of it.
  assertEqual(p('t:b;a').compare(p('t:a;b')), 0, 'writing order is no part of it');
}

function runTests() {
  const tests = [
    ['TEST392', test392_least_upper_bound],
    ['TEST599', test599_every_row_of_the_models_table],
    ['TEST600', test600_every_model_function_carries_a_proved_claim],
    // Parsing/Creation (TEST501-TEST518)
    ['TEST501', test501_tagged_urn_creation],
    ['TEST502', test502_custom_prefix],
    ['TEST503', test503_prefix_case_insensitive],
    ['TEST504', test504_prefix_mismatch_error],
    ['TEST505', test505_builder_with_prefix],
    ['TEST506', test506_unquoted_values_lowercased],
    ['TEST507', test507_quoted_values_preserve_case],
    ['TEST508', test508_quoted_value_special_chars],
    ['TEST509', test509_quoted_value_escape_sequences],
    ['TEST510', test510_mixed_quoted_unquoted],
    ['TEST511', test511_unterminated_quote_error],
    ['TEST512', test512_invalid_escape_sequence_error],
    ['TEST513', test513_serialization_smart_quoting],
    ['TEST514', test514_round_trip_simple],
    ['TEST515', test515_round_trip_quoted],
    ['TEST516', test516_round_trip_escapes],
    ['TEST517', test517_prefix_required],
    ['TEST518', test518_trailing_semicolon_equivalence],
    // Canonical form (TEST519)
    ['TEST519', test519_canonical_string_format],
    // Tag access/matching (TEST520-TEST522)
    ['TEST520', test520_tag_matching],
    ['TEST521', test521_matching_case_sensitive_values],
    ['TEST522', test522_missing_tag_handling],
    // Specificity (TEST523)
    ['TEST523', test523_specificity],
    // Builder (TEST524-TEST525)
    ['TEST524', test524_builder],
    ['TEST525', test525_builder_preserves_case],
    // Compatibility/matching (TEST526-TEST527)
    ['TEST526', test526_compatibility],
    ['TEST527', test527_best_match],
    // Set operations (TEST528-TEST529)
    ['TEST528', test528_merge_and_subset],
    ['TEST529', test529_merge_prefix_mismatch],
    // Wildcards (TEST530)
    ['TEST530', test530_wildcard_tag],
    // Empty URNs (TEST531-TEST532)
    ['TEST531', test531_empty_tagged_urn],
    ['TEST532', test532_empty_with_custom_prefix],
    // Character support/validation (TEST533-TEST542)
    ['TEST533', test533_extended_character_support],
    ['TEST534', test534_wildcard_restrictions],
    ['TEST535', test535_duplicate_key_rejection],
    ['TEST536', test536_numeric_key_restriction],
    ['TEST537', test537_empty_value_error],
    ['TEST538', test538_has_tag_case_sensitive],
    ['TEST539', test539_with_tag_preserves_value],
    ['TEST540', test540_with_tag_rejects_empty_value],
    ['TEST541', test541_builder_rejects_empty_value],
    ['TEST542', test542_semantic_equivalence],
    // Matching semantics core (TEST543-TEST552)
    ['TEST543', test543_matching_semantics_exact_match],
    ['TEST544', test544_matching_semantics_instance_missing_tag],
    ['TEST545', test545_matching_semantics_extra_tag],
    ['TEST546', test546_matching_semantics_request_wildcard],
    ['TEST547', test547_matching_semantics_cap_wildcard],
    ['TEST548', test548_matching_semantics_value_mismatch],
    ['TEST549', test549_matching_semantics_pattern_extra_tag],
    ['TEST550', test550_matching_semantics_empty_pattern],
    ['TEST551', test551_matching_semantics_cross_dimension],
    ['TEST552', test552_matching_different_prefixes_error],
    // Valueless tags (TEST553-TEST566)
    ['TEST553', test553_valueless_tag_parsing_single],
    ['TEST554', test554_valueless_tag_parsing_multiple],
    ['TEST555', test555_valueless_tag_mixed_with_valued],
    ['TEST556', test556_valueless_tag_at_end],
    ['TEST557', test557_valueless_tag_equivalence_to_wildcard],
    ['TEST558', test558_valueless_tag_matching],
    ['TEST559', test559_valueless_tag_in_pattern],
    ['TEST560', test560_valueless_tag_specificity],
    ['TEST561', test561_valueless_tag_roundtrip],
    ['TEST562', test562_valueless_tag_case_normalization],
    ['TEST563', test563_empty_value_still_error],
    ['TEST564', test564_valueless_tag_compatibility],
    ['TEST565', test565_valueless_numeric_key_still_rejected],
    ['TEST566', test566_whitespace_in_input_rejected],
    // Special values (TEST567-TEST577)
    ['TEST567', test567_unspecified_question_mark_parsing],
    ['TEST568', test568_must_not_have_exclamation_parsing],
    ['TEST569', test569_question_mark_pattern_matches_anything],
    ['TEST570', test570_question_mark_in_instance],
    ['TEST571', test571_must_not_have_pattern_requires_absent],
    ['TEST572', test572_must_not_have_in_instance],
    ['TEST573', test573_full_cross_product_matching],
    ['TEST574', test574_mixed_special_values],
    ['TEST575', test575_serialization_round_trip_special_values],
    ['TEST576', test576_compatibility_with_special_values],
    ['TEST577', test577_specificity_with_special_values],
    // Order-theoretic relations, builder, delta (TEST578-TEST598)
    ['TEST578', test578_equivalent_identical_tags],
    ['TEST579', test579_not_equivalent_when_one_more_specific],
    ['TEST580', test580_comparable_specialization_chain],
    ['TEST581', test581_incomparable_different_branches],
    ['TEST582', test582_equivalent_implies_comparable],
    ['TEST583', test583_prefix_mismatch_errors],
    ['TEST584', test584_empty_tags_comparable_to_all],
    ['TEST585', test585_string_variants],
    ['TEST586', test586_special_values],
    ['TEST587', test587_builder_fluent_api],
    ['TEST588', test588_builder_custom_tags],
    ['TEST589', test589_builder_tag_overrides],
    ['TEST590', test590_builder_empty_build],
    ['TEST591', test591_builder_single_tag],
    ['TEST592', test592_builder_complex],
    ['TEST593', test593_builder_wildcards],
    ['TEST594', test594_builder_custom_prefix],
    ['TEST595', test595_builder_matching_with_built_urn],
    ['TEST596', test596_empty_delta_preserves_refinement],
    ['TEST597', test597_incomparable_replacement],
    ['TEST598', test598_comparable_removal],
    // Text grammar (TEST6752-TEST6756)
    ['TEST6752', test6752_qualifier_value_alias],
    ['TEST6753', test6753_prefix_and_key_are_identifiers],
    ['TEST6754', test6754_every_value_reads_back],
    ['TEST6755', test6755_unquoted_value_takes_any_non_separator],
    ['TEST6756', test6756_quoted_value_is_literal],
    ['TEST7241', test7241_urns_are_ordered_by_their_parts],
    ['TEST7210', test7210_admits_absence_by_form],
    ['TEST7223', test7223_urn_read_back_from_its_handle],
    // JS-only tests
    ['JS-ONLY: op tag rename', test0001_JsOnly_op_tag_rename],
    // Convenience method tests
    ['conformsToStr', test0002_ConformsToStr],
    ['acceptsStr', test0003_AcceptsStr],
    ['canonical', test0004_Canonical],
    ['canonicalOption', test0005_CanonicalOption],
  ];

  console.log('Running Tagged URN JavaScript tests...\n');

  let passed = 0;
  let failed = 0;

  for (const [name, fn] of tests) {
    try {
      fn();
      console.log(`  OK ${name}`);
      passed++;
    } catch (error) {
      console.error(`  FAIL ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed, ${tests.length} total`);

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed`);
  }
}

// Run the tests when this file is the program, not when it is imported.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runTests();
    process.exit(0);
  } catch (error) {
    console.error('\nERR Test suite failed:', error.message);
    process.exit(1);
  }
}

export { runTests };
