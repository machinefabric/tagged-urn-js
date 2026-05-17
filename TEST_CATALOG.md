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
| test501 | `test501_tagged_urn_creation` | TEST501: Verify basic URN creation from string with multiple tags | tagged-urn.test.js:64 |
| test502 | `test502_custom_prefix` | TEST502: Verify custom prefixes work and tags are sorted alphabetically | tagged-urn.test.js:73 |
| test503 | `test503_prefix_case_insensitive` | TEST503: Verify prefix is case-insensitive (CAP, cap, Cap all equal) | tagged-urn.test.js:81 |
| test504 | `test504_prefix_mismatch_error` | TEST504: Verify error when comparing URNs with different prefixes | tagged-urn.test.js:96 |
| test505 | `test505_builder_with_prefix` | TEST505: Verify builder pattern works with custom prefix | tagged-urn.test.js:108 |
| test506 | `test506_unquoted_values_lowercased` | TEST506: Verify unquoted values are normalized to lowercase | tagged-urn.test.js:118 |
| test507 | `test507_quoted_values_preserve_case` | TEST507: Verify quoted values preserve their case exactly | tagged-urn.test.js:138 |
| test508 | `test508_quoted_value_special_chars` | TEST508: Verify semicolons, equals, and spaces in quoted values are allowed | tagged-urn.test.js:155 |
| test509 | `test509_quoted_value_escape_sequences` | TEST509: Verify escape sequences in quoted values are parsed correctly | tagged-urn.test.js:167 |
| test510 | `test510_mixed_quoted_unquoted` | TEST510: Verify mixing quoted and unquoted values in same URN | tagged-urn.test.js:182 |
| test511 | `test511_unterminated_quote_error` | TEST511: Verify error on unterminated quoted value | tagged-urn.test.js:189 |
| test512 | `test512_invalid_escape_sequence_error` | TEST512: Verify error on invalid escape sequences (only \\" and \\\\ allowed) | tagged-urn.test.js:198 |
| test513 | `test513_serialization_smart_quoting` | TEST513: Verify smart quoting: quotes only when necessary | tagged-urn.test.js:213 |
| test514 | `test514_round_trip_simple` | TEST514: Verify simple URN round-trips correctly (parse -> serialize -> parse) | tagged-urn.test.js:242 |
| test515 | `test515_round_trip_quoted` | TEST515: Verify quoted values round-trip correctly | tagged-urn.test.js:251 |
| test516 | `test516_round_trip_escapes` | TEST516: Verify escape sequences round-trip correctly | tagged-urn.test.js:261 |
| test517 | `test517_prefix_required` | TEST517: Verify missing prefix causes error | tagged-urn.test.js:271 |
| test518 | `test518_trailing_semicolon_equivalence` | TEST518: Verify trailing semicolon is optional and doesn't affect equality | tagged-urn.test.js:293 |
| test519 | `test519_canonical_string_format` | TEST519: Verify canonical form: alphabetically sorted tags, no trailing semicolon | tagged-urn.test.js:308 |
| test520 | `test520_tag_matching` | TEST520: Verify hasTag and getTag methods work correctly | tagged-urn.test.js:318 |
| test521 | `test521_matching_case_sensitive_values` | TEST521: Verify value matching is case-sensitive | tagged-urn.test.js:338 |
| test522 | `test522_missing_tag_handling` | TEST522: Verify handling of missing tags in conformsTo semantics | tagged-urn.test.js:360 |
| test523 | `test523_specificity` | TEST523: Verify six-form per-tag specificity ladder. ?x        : 0 x?=v      : 1 x (=x=*)  : 2 x!=v      : 3 x=v       : 4 !x        : 5 | tagged-urn.test.js:393 |
| test524 | `test524_builder` | TEST524: Verify builder creates correct URN | tagged-urn.test.js:418 |
| test525 | `test525_builder_preserves_case` | TEST525: Verify builder preserves case in quoted values | tagged-urn.test.js:431 |
| test526 | `test526_compatibility` | TEST526: Verify directional accepts for URN matching | tagged-urn.test.js:443 |
| test527 | `test527_best_match` | TEST527: Verify UrnMatcher finds best match among candidates | tagged-urn.test.js:467 |
| test528 | `test528_merge_and_subset` | TEST528: Verify merge and subset operations | tagged-urn.test.js:491 |
| test529 | `test529_merge_prefix_mismatch` | TEST529: Verify error when merging URNs with different prefixes | tagged-urn.test.js:504 |
| test530 | `test530_wildcard_tag` | TEST530: Verify wildcard value matching behavior | tagged-urn.test.js:520 |
| test531 | `test531_empty_tagged_urn` | TEST531: Verify empty URN (no tags) is valid and matches everything | tagged-urn.test.js:531 |
| test532 | `test532_empty_with_custom_prefix` | TEST532: Verify empty URN works with custom prefix | tagged-urn.test.js:549 |
| test533 | `test533_extended_character_support` | TEST533: Verify forward slashes and colons in tag components | tagged-urn.test.js:560 |
| test534 | `test534_wildcard_restrictions` | TEST534: Verify wildcard cannot be used as a key | tagged-urn.test.js:567 |
| test535 | `test535_duplicate_key_rejection` | TEST535: Verify duplicate keys are rejected with error | tagged-urn.test.js:579 |
| test536 | `test536_numeric_key_restriction` | TEST536: Verify purely numeric keys are rejected | tagged-urn.test.js:588 |
| test537 | `test537_empty_value_error` | TEST537: Verify empty values (key=) cause error | tagged-urn.test.js:606 |
| test538 | `test538_has_tag_case_sensitive` | TEST538: Verify hasTag value comparison is case-sensitive | tagged-urn.test.js:620 |
| test539 | `test539_with_tag_preserves_value` | TEST539: Verify withTag preserves value case | tagged-urn.test.js:636 |
| test540 | `test540_with_tag_rejects_empty_value` | TEST540: Verify withTag rejects empty value | tagged-urn.test.js:642 |
| test541 | `test541_builder_rejects_empty_value` | TEST541: Verify builder rejects empty value | tagged-urn.test.js:651 |
| test542 | `test542_semantic_equivalence` | TEST542: Verify unquoted and quoted simple lowercase values are equivalent | tagged-urn.test.js:660 |
| test543 | `test543_matching_semantics_exact_match` | TEST543: Instance and pattern have same tag/value - matches | tagged-urn.test.js:675 |
| test544 | `test544_matching_semantics_instance_missing_tag` | TEST544: Pattern requires tag but instance doesn't have it - no match | tagged-urn.test.js:682 |
| test545 | `test545_matching_semantics_extra_tag` | TEST545: Instance has extra tag not in pattern - still matches | tagged-urn.test.js:692 |
| test546 | `test546_matching_semantics_request_wildcard` | TEST546: Pattern has wildcard - matches any value | tagged-urn.test.js:699 |
| test547 | `test547_matching_semantics_cap_wildcard` | TEST547: Instance has wildcard - matches any pattern constraint | tagged-urn.test.js:706 |
| test548 | `test548_matching_semantics_value_mismatch` | TEST548: Instance and pattern have same key but different values - no match | tagged-urn.test.js:713 |
| test549 | `test549_matching_semantics_pattern_extra_tag` | TEST549: Pattern has constraint instance doesn't have - no match | tagged-urn.test.js:720 |
| test550 | `test550_matching_semantics_empty_pattern` | TEST550: Empty pattern matches any instance | tagged-urn.test.js:730 |
| test551 | `test551_matching_semantics_cross_dimension` | TEST551: Multiple independent tag constraints work correctly | tagged-urn.test.js:741 |
| test552 | `test552_matching_different_prefixes_error` | TEST552: Matching URNs with different prefixes returns error | tagged-urn.test.js:752 |
| test553 | `test553_valueless_tag_parsing_single` | TEST553: Single value-less tag parses as wildcard | tagged-urn.test.js:780 |
| test554 | `test554_valueless_tag_parsing_multiple` | TEST554: Multiple value-less tags parse correctly | tagged-urn.test.js:787 |
| test555 | `test555_valueless_tag_mixed_with_valued` | TEST555: Mix of valueless and valued tags works | tagged-urn.test.js:796 |
| test556 | `test556_valueless_tag_at_end` | TEST556: Valueless tag at end (no trailing semicolon) works | tagged-urn.test.js:806 |
| test557 | `test557_valueless_tag_equivalence_to_wildcard` | TEST557: Valueless tag is equivalent to explicit wildcard | tagged-urn.test.js:814 |
| test558 | `test558_valueless_tag_matching` | TEST558: Valueless tag (wildcard) matches any value | tagged-urn.test.js:823 |
| test559 | `test559_valueless_tag_in_pattern` | TEST559: Pattern with valueless tag requires instance to have tag (any value) | tagged-urn.test.js:835 |
| test560 | `test560_valueless_tag_specificity` | TEST560: Bare marker (=`x=*`) contributes 2 points; exact contributes 4. | tagged-urn.test.js:850 |
| test561 | `test561_valueless_tag_roundtrip` | TEST561: Valueless tags round-trip correctly (serialize as just key) | tagged-urn.test.js:861 |
| test562 | `test562_valueless_tag_case_normalization` | TEST562: Valueless tags normalized to lowercase | tagged-urn.test.js:871 |
| test563 | `test563_empty_value_still_error` | TEST563: Empty value with = is still error (different from valueless) | tagged-urn.test.js:880 |
| test564 | `test564_valueless_tag_compatibility` | TEST564: Valueless tags (wildcard) accept any specific value | tagged-urn.test.js:894 |
| test565 | `test565_valueless_numeric_key_still_rejected` | TEST565: Purely numeric keys still rejected for valueless tags | tagged-urn.test.js:908 |
| test566 | `test566_whitespace_in_input_rejected` | TEST566: Leading/trailing whitespace in input is rejected | tagged-urn.test.js:922 |
| test567 | `test567_unspecified_question_mark_parsing` | TEST567: All three input aliases (?x, x?, x=?) parse to stored value "?" and serialize as the canonical prefix form `?x`. | tagged-urn.test.js:959 |
| test568 | `test568_must_not_have_exclamation_parsing` | TEST568: All three input aliases (!x, x!, x=!) parse to stored value "!" and serialize as the canonical prefix form `!x`. | tagged-urn.test.js:967 |
| test569 | `test569_question_mark_pattern_matches_anything` | TEST569: Pattern with K=? matches any instance (with or without K) | tagged-urn.test.js:974 |
| test570 | `test570_question_mark_in_instance` | TEST570: Instance with K=? matches any pattern constraint | tagged-urn.test.js:991 |
| test571 | `test571_must_not_have_pattern_requires_absent` | TEST571: Pattern with K=! requires instance to NOT have K | tagged-urn.test.js:1008 |
| test572 | `test572_must_not_have_in_instance` | TEST572: Instance with K=! conflicts with patterns requiring K | tagged-urn.test.js:1023 |
| test573 | `test573_full_cross_product_matching` | TEST573: Comprehensive test of all instance/pattern combinations | tagged-urn.test.js:1040 |
| test574 | `test574_mixed_special_values` | TEST574: URNs with multiple special values work correctly | tagged-urn.test.js:1088 |
| test575 | `test575_serialization_round_trip_special_values` | TEST575: All special values round-trip correctly | tagged-urn.test.js:1109 |
| test576 | `test576_compatibility_with_special_values` | TEST576: Bidirectional accepts with special values | tagged-urn.test.js:1126 |
| test577 | `test577_specificity_with_special_values` | TEST577: Verify graded specificity with the six-form ladder. ?x=0, x?=v=1, x=*=2, x!=v=3, x=v=4, !x=5 | tagged-urn.test.js:1159 |
| | | | |
| unnumbered | `testAcceptsStr` | Test acceptsStr convenience method | tagged-urn.test.js:1213 |
| unnumbered | `testCanonical` | Test canonical static method | tagged-urn.test.js:1222 |
| unnumbered | `testCanonicalOption` | Test canonicalOption static method | tagged-urn.test.js:1231 |
| unnumbered | `testConformsToStr` | Test conformsToStr convenience method | tagged-urn.test.js:1204 |
| unnumbered | `testJsOnly_op_tag_rename` | JS-only: Test marker tags are authored without an `action` key | tagged-urn.test.js:1187 |
---

## Unnumbered Tests

The following tests are cataloged but do not currently participate in numeric test indexing.

- `testAcceptsStr` — tagged-urn.test.js:1213
- `testCanonical` — tagged-urn.test.js:1222
- `testCanonicalOption` — tagged-urn.test.js:1231
- `testConformsToStr` — tagged-urn.test.js:1204
- `testJsOnly_op_tag_rename` — tagged-urn.test.js:1187

---

*Generated from JS source tree*
*Total tests: 82*
*Total numbered tests: 77*
*Total unnumbered tests: 5*
*Total numbered tests missing descriptions: 0*
*Total numbering mismatches: 0*
