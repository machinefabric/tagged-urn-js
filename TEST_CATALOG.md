# JS Test Catalog

**Total Tests:** 82

**Numbered Tests:** 77

**Unnumbered Tests:** 5

**Numbered Tests Missing Descriptions:** 0

**Numbering Mismatches:** 0

All numbered test numbers are unique.

This catalog lists all tests in the JS codebase.

| Test # | Function Name | Description | File |
|--------|---------------|-------------|------|
| test501 | `test501_tagged_urn_creation` | TEST501: Verify basic URN creation from string with multiple tags | tagged-urn.test.js:63 |
| test502 | `test502_custom_prefix` | TEST502: Verify custom prefixes work and tags are sorted alphabetically | tagged-urn.test.js:72 |
| test503 | `test503_prefix_case_insensitive` | TEST503: Verify prefix is case-insensitive (CAP, cap, Cap all equal) | tagged-urn.test.js:80 |
| test504 | `test504_prefix_mismatch_error` | TEST504: Verify error when comparing URNs with different prefixes | tagged-urn.test.js:95 |
| test505 | `test505_builder_with_prefix` | TEST505: Verify builder pattern works with custom prefix | tagged-urn.test.js:107 |
| test506 | `test506_unquoted_values_lowercased` | TEST506: Verify unquoted values are normalized to lowercase | tagged-urn.test.js:117 |
| test507 | `test507_quoted_values_preserve_case` | TEST507: Verify quoted values preserve their case exactly | tagged-urn.test.js:137 |
| test508 | `test508_quoted_value_special_chars` | TEST508: Verify semicolons, equals, and spaces in quoted values are allowed | tagged-urn.test.js:154 |
| test509 | `test509_quoted_value_escape_sequences` | TEST509: Verify escape sequences in quoted values are parsed correctly | tagged-urn.test.js:166 |
| test510 | `test510_mixed_quoted_unquoted` | TEST510: Verify mixing quoted and unquoted values in same URN | tagged-urn.test.js:181 |
| test511 | `test511_unterminated_quote_error` | TEST511: Verify error on unterminated quoted value | tagged-urn.test.js:188 |
| test512 | `test512_invalid_escape_sequence_error` | TEST512: Verify error on invalid escape sequences (only \\" and \\\\ allowed) | tagged-urn.test.js:197 |
| test513 | `test513_serialization_smart_quoting` | TEST513: Verify smart quoting: quotes only when necessary | tagged-urn.test.js:212 |
| test514 | `test514_round_trip_simple` | TEST514: Verify simple URN round-trips correctly (parse -> serialize -> parse) | tagged-urn.test.js:241 |
| test515 | `test515_round_trip_quoted` | TEST515: Verify quoted values round-trip correctly | tagged-urn.test.js:250 |
| test516 | `test516_round_trip_escapes` | TEST516: Verify escape sequences round-trip correctly | tagged-urn.test.js:260 |
| test517 | `test517_prefix_required` | TEST517: Verify missing prefix causes error | tagged-urn.test.js:270 |
| test518 | `test518_trailing_semicolon_equivalence` | TEST518: Verify trailing semicolon is optional and doesn't affect equality | tagged-urn.test.js:292 |
| test519 | `test519_canonical_string_format` | TEST519: Verify canonical form: alphabetically sorted tags, no trailing semicolon | tagged-urn.test.js:307 |
| test520 | `test520_tag_matching` | TEST520: Verify hasTag and getTag methods work correctly | tagged-urn.test.js:317 |
| test521 | `test521_matching_case_sensitive_values` | TEST521: Verify value matching is case-sensitive | tagged-urn.test.js:337 |
| test522 | `test522_missing_tag_handling` | TEST522: Verify handling of missing tags in conformsTo semantics | tagged-urn.test.js:359 |
| test523 | `test523_specificity` | TEST523: Verify six-form per-tag specificity ladder. ?x        : 0 x?=v      : 1 x (=x=*)  : 2 x!=v      : 3 x=v       : 4 !x        : 5 | tagged-urn.test.js:392 |
| test524 | `test524_builder` | TEST524: Verify builder creates correct URN | tagged-urn.test.js:417 |
| test525 | `test525_builder_preserves_case` | TEST525: Verify builder preserves case in quoted values | tagged-urn.test.js:430 |
| test526 | `test526_compatibility` | TEST526: Verify directional accepts for URN matching | tagged-urn.test.js:442 |
| test527 | `test527_best_match` | TEST527: Verify UrnMatcher finds best match among candidates | tagged-urn.test.js:466 |
| test528 | `test528_merge_and_subset` | TEST528: Verify merge and subset operations | tagged-urn.test.js:490 |
| test529 | `test529_merge_prefix_mismatch` | TEST529: Verify error when merging URNs with different prefixes | tagged-urn.test.js:503 |
| test530 | `test530_wildcard_tag` | TEST530: Verify wildcard value matching behavior | tagged-urn.test.js:519 |
| test531 | `test531_empty_tagged_urn` | TEST531: Verify empty URN (no tags) is valid and matches everything | tagged-urn.test.js:530 |
| test532 | `test532_empty_with_custom_prefix` | TEST532: Verify empty URN works with custom prefix | tagged-urn.test.js:548 |
| test533 | `test533_extended_character_support` | TEST533: Verify forward slashes and colons in tag components | tagged-urn.test.js:559 |
| test534 | `test534_wildcard_restrictions` | TEST534: Verify wildcard cannot be used as a key | tagged-urn.test.js:566 |
| test535 | `test535_duplicate_key_rejection` | TEST535: Verify duplicate keys are rejected with error | tagged-urn.test.js:578 |
| test536 | `test536_numeric_key_restriction` | TEST536: Verify purely numeric keys are rejected | tagged-urn.test.js:587 |
| test537 | `test537_empty_value_error` | TEST537: Verify empty values (key=) cause error | tagged-urn.test.js:605 |
| test538 | `test538_has_tag_case_sensitive` | TEST538: Verify hasTag value comparison is case-sensitive | tagged-urn.test.js:619 |
| test539 | `test539_with_tag_preserves_value` | TEST539: Verify withTag preserves value case | tagged-urn.test.js:635 |
| test540 | `test540_with_tag_rejects_empty_value` | TEST540: Verify withTag rejects empty value | tagged-urn.test.js:641 |
| test541 | `test541_builder_rejects_empty_value` | TEST541: Verify builder rejects empty value | tagged-urn.test.js:650 |
| test542 | `test542_semantic_equivalence` | TEST542: Verify unquoted and quoted simple lowercase values are equivalent | tagged-urn.test.js:659 |
| test543 | `test543_matching_semantics_exact_match` | TEST543: Instance and pattern have same tag/value - matches | tagged-urn.test.js:674 |
| test544 | `test544_matching_semantics_instance_missing_tag` | TEST544: Pattern requires tag but instance doesn't have it - no match | tagged-urn.test.js:681 |
| test545 | `test545_matching_semantics_extra_tag` | TEST545: Instance has extra tag not in pattern - still matches | tagged-urn.test.js:691 |
| test546 | `test546_matching_semantics_request_wildcard` | TEST546: Pattern has wildcard - matches any value | tagged-urn.test.js:698 |
| test547 | `test547_matching_semantics_cap_wildcard` | TEST547: Instance has wildcard - matches any pattern constraint | tagged-urn.test.js:705 |
| test548 | `test548_matching_semantics_value_mismatch` | TEST548: Instance and pattern have same key but different values - no match | tagged-urn.test.js:712 |
| test549 | `test549_matching_semantics_pattern_extra_tag` | TEST549: Pattern has constraint instance doesn't have - no match | tagged-urn.test.js:719 |
| test550 | `test550_matching_semantics_empty_pattern` | TEST550: Empty pattern matches any instance | tagged-urn.test.js:729 |
| test551 | `test551_matching_semantics_cross_dimension` | TEST551: Multiple independent tag constraints work correctly | tagged-urn.test.js:740 |
| test552 | `test552_matching_different_prefixes_error` | TEST552: Matching URNs with different prefixes returns error | tagged-urn.test.js:751 |
| test553 | `test553_valueless_tag_parsing_single` | TEST553: Single value-less tag parses as wildcard | tagged-urn.test.js:779 |
| test554 | `test554_valueless_tag_parsing_multiple` | TEST554: Multiple value-less tags parse correctly | tagged-urn.test.js:786 |
| test555 | `test555_valueless_tag_mixed_with_valued` | TEST555: Mix of valueless and valued tags works | tagged-urn.test.js:795 |
| test556 | `test556_valueless_tag_at_end` | TEST556: Valueless tag at end (no trailing semicolon) works | tagged-urn.test.js:805 |
| test557 | `test557_valueless_tag_equivalence_to_wildcard` | TEST557: Valueless tag is equivalent to explicit wildcard | tagged-urn.test.js:813 |
| test558 | `test558_valueless_tag_matching` | TEST558: Valueless tag (wildcard) matches any value | tagged-urn.test.js:822 |
| test559 | `test559_valueless_tag_in_pattern` | TEST559: Pattern with valueless tag requires instance to have tag (any value) | tagged-urn.test.js:834 |
| test560 | `test560_valueless_tag_specificity` | TEST560: Bare marker (=`x=*`) contributes 2 points; exact contributes 4. | tagged-urn.test.js:849 |
| test561 | `test561_valueless_tag_roundtrip` | TEST561: Valueless tags round-trip correctly (serialize as just key) | tagged-urn.test.js:860 |
| test562 | `test562_valueless_tag_case_normalization` | TEST562: Valueless tags normalized to lowercase | tagged-urn.test.js:870 |
| test563 | `test563_empty_value_still_error` | TEST563: Empty value with = is still error (different from valueless) | tagged-urn.test.js:879 |
| test564 | `test564_valueless_tag_compatibility` | TEST564: Valueless tags (wildcard) accept any specific value | tagged-urn.test.js:893 |
| test565 | `test565_valueless_numeric_key_still_rejected` | TEST565: Purely numeric keys still rejected for valueless tags | tagged-urn.test.js:907 |
| test566 | `test566_whitespace_in_input_rejected` | TEST566: Leading/trailing whitespace in input is rejected | tagged-urn.test.js:921 |
| test567 | `test567_unspecified_question_mark_parsing` | TEST567: All three input aliases (?x, x?, x=?) parse to stored value "?" and serialize as the canonical prefix form `?x`. | tagged-urn.test.js:958 |
| test568 | `test568_must_not_have_exclamation_parsing` | TEST568: All three input aliases (!x, x!, x=!) parse to stored value "!" and serialize as the canonical prefix form `!x`. | tagged-urn.test.js:966 |
| test569 | `test569_question_mark_pattern_matches_anything` | TEST569: Pattern with K=? matches any instance (with or without K) | tagged-urn.test.js:973 |
| test570 | `test570_question_mark_in_instance` | TEST570: Instance with K=? matches any pattern constraint | tagged-urn.test.js:990 |
| test571 | `test571_must_not_have_pattern_requires_absent` | TEST571: Pattern with K=! requires instance to NOT have K | tagged-urn.test.js:1007 |
| test572 | `test572_must_not_have_in_instance` | TEST572: Instance with K=! conflicts with patterns requiring K | tagged-urn.test.js:1022 |
| test573 | `test573_full_cross_product_matching` | TEST573: Comprehensive test of all instance/pattern combinations | tagged-urn.test.js:1039 |
| test574 | `test574_mixed_special_values` | TEST574: URNs with multiple special values work correctly | tagged-urn.test.js:1087 |
| test575 | `test575_serialization_round_trip_special_values` | TEST575: All special values round-trip correctly | tagged-urn.test.js:1108 |
| test576 | `test576_compatibility_with_special_values` | TEST576: Bidirectional accepts with special values | tagged-urn.test.js:1125 |
| test577 | `test577_specificity_with_special_values` | TEST577: Verify graded specificity with the six-form ladder. ?x=0, x?=v=1, x=*=2, x!=v=3, x=v=4, !x=5 | tagged-urn.test.js:1158 |
| | | | |
| unnumbered | `testAcceptsStr` | Test acceptsStr convenience method | tagged-urn.test.js:1212 |
| unnumbered | `testCanonical` | Test canonical static method | tagged-urn.test.js:1221 |
| unnumbered | `testCanonicalOption` | Test canonicalOption static method | tagged-urn.test.js:1230 |
| unnumbered | `testConformsToStr` | Test conformsToStr convenience method | tagged-urn.test.js:1203 |
| unnumbered | `testJsOnly_op_tag_rename` | JS-only: Test marker tags are authored without an `action` key | tagged-urn.test.js:1186 |
---

## Unnumbered Tests

The following tests are cataloged but do not currently participate in numeric test indexing.

- `testAcceptsStr` — tagged-urn.test.js:1212
- `testCanonical` — tagged-urn.test.js:1221
- `testCanonicalOption` — tagged-urn.test.js:1230
- `testConformsToStr` — tagged-urn.test.js:1203
- `testJsOnly_op_tag_rename` — tagged-urn.test.js:1186

---

*Generated from JS source tree*
*Total tests: 82*
*Total numbered tests: 77*
*Total unnumbered tests: 5*
*Total numbered tests missing descriptions: 0*
*Total numbering mismatches: 0*
