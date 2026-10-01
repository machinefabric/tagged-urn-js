# Test catalogue — tagged-urn/tagged-urn-js

Generated from the test catalogue. Edit the tests, not this file.

83 tests: 83 numbered, 0 unnumbered.

## Numbered

| Number | Repository | Language | Test | Location | Description |
|---|---|---|---|---|---|
| TEST1 | tagged-urn/tagged-urn-js | js | `test0001_JsOnly_op_tag_rename` | tagged-urn.test.js:1218 | JS-only: Test marker tags are authored without an `action` key |
| TEST2 | tagged-urn/tagged-urn-js | js | `test0002_ConformsToStr` | tagged-urn.test.js:1235 | Test conformsToStr convenience method |
| TEST3 | tagged-urn/tagged-urn-js | js | `test0003_AcceptsStr` | tagged-urn.test.js:1244 | Test acceptsStr convenience method |
| TEST4 | tagged-urn/tagged-urn-js | js | `test0004_Canonical` | tagged-urn.test.js:1253 | Test canonical static method |
| TEST5 | tagged-urn/tagged-urn-js | js | `test0005_CanonicalOption` | tagged-urn.test.js:1262 | Test canonicalOption static method |
| TEST501 | tagged-urn/tagged-urn-js | js | `test501_tagged_urn_creation` | tagged-urn.test.js:66 | TEST501: Verify basic URN creation from string with multiple tags |
| TEST502 | tagged-urn/tagged-urn-js | js | `test502_custom_prefix` | tagged-urn.test.js:75 | TEST502: Verify custom prefixes work and tags are sorted alphabetically |
| TEST503 | tagged-urn/tagged-urn-js | js | `test503_prefix_case_insensitive` | tagged-urn.test.js:83 | TEST503: Verify prefix is case-insensitive (CAP, cap, Cap all equal) |
| TEST504 | tagged-urn/tagged-urn-js | js | `test504_prefix_mismatch_error` | tagged-urn.test.js:98 | TEST504: Verify error when comparing URNs with different prefixes |
| TEST505 | tagged-urn/tagged-urn-js | js | `test505_builder_with_prefix` | tagged-urn.test.js:110 | TEST505: Verify builder pattern works with custom prefix |
| TEST506 | tagged-urn/tagged-urn-js | js | `test506_unquoted_values_lowercased` | tagged-urn.test.js:120 | TEST506: Verify unquoted values are normalized to lowercase |
| TEST507 | tagged-urn/tagged-urn-js | js | `test507_quoted_values_preserve_case` | tagged-urn.test.js:140 | TEST507: Verify quoted values preserve their case exactly |
| TEST508 | tagged-urn/tagged-urn-js | js | `test508_quoted_value_special_chars` | tagged-urn.test.js:157 | TEST508: Verify semicolons, equals, and spaces in quoted values are allowed |
| TEST509 | tagged-urn/tagged-urn-js | js | `test509_quoted_value_escape_sequences` | tagged-urn.test.js:169 | TEST509: Verify escape sequences in quoted values are parsed correctly |
| TEST510 | tagged-urn/tagged-urn-js | js | `test510_mixed_quoted_unquoted` | tagged-urn.test.js:184 | TEST510: Verify mixing quoted and unquoted values in same URN |
| TEST511 | tagged-urn/tagged-urn-js | js | `test511_unterminated_quote_error` | tagged-urn.test.js:191 | TEST511: Verify error on unterminated quoted value |
| TEST512 | tagged-urn/tagged-urn-js | js | `test512_invalid_escape_sequence_error` | tagged-urn.test.js:200 | TEST512: Verify error on invalid escape sequences (only \\" and \\\\ allowed) |
| TEST513 | tagged-urn/tagged-urn-js | js | `test513_serialization_smart_quoting` | tagged-urn.test.js:215 | TEST513: Verify smart quoting: quotes only when necessary |
| TEST514 | tagged-urn/tagged-urn-js | js | `test514_round_trip_simple` | tagged-urn.test.js:244 | TEST514: Verify simple URN round-trips correctly (parse -> serialize -> parse) |
| TEST515 | tagged-urn/tagged-urn-js | js | `test515_round_trip_quoted` | tagged-urn.test.js:253 | TEST515: Verify quoted values round-trip correctly |
| TEST516 | tagged-urn/tagged-urn-js | js | `test516_round_trip_escapes` | tagged-urn.test.js:263 | TEST516: Verify escape sequences round-trip correctly |
| TEST517 | tagged-urn/tagged-urn-js | js | `test517_prefix_required` | tagged-urn.test.js:273 | TEST517: Verify missing prefix causes error |
| TEST518 | tagged-urn/tagged-urn-js | js | `test518_trailing_semicolon_equivalence` | tagged-urn.test.js:295 | TEST518: Verify trailing semicolon is optional and doesn't affect equality |
| TEST519 | tagged-urn/tagged-urn-js | js | `test519_canonical_string_format` | tagged-urn.test.js:310 | TEST519: Verify canonical form: alphabetically sorted tags, no trailing semicolon |
| TEST520 | tagged-urn/tagged-urn-js | js | `test520_tag_matching` | tagged-urn.test.js:320 | TEST520: Verify hasTag and getTag methods work correctly |
| TEST521 | tagged-urn/tagged-urn-js | js | `test521_matching_case_sensitive_values` | tagged-urn.test.js:340 | TEST521: Verify value matching is case-sensitive |
| TEST522 | tagged-urn/tagged-urn-js | js | `test522_missing_tag_handling` | tagged-urn.test.js:362 | TEST522: Verify handling of missing tags in conformsTo semantics |
| TEST523 | tagged-urn/tagged-urn-js | js | `test523_specificity` | tagged-urn.test.js:395 | TEST523: Verify six-form per-tag specificity ladder. ?x        : 0 x?=v      : 1 x (=x=*)  : 2 x!=v      : 3 x=v       : 4 !x        : 5 |
| TEST524 | tagged-urn/tagged-urn-js | js | `test524_builder` | tagged-urn.test.js:420 | TEST524: Verify builder creates correct URN |
| TEST525 | tagged-urn/tagged-urn-js | js | `test525_builder_preserves_case` | tagged-urn.test.js:433 | TEST525: Verify builder preserves case in quoted values |
| TEST526 | tagged-urn/tagged-urn-js | js | `test526_compatibility` | tagged-urn.test.js:445 | TEST526: Verify directional accepts for URN matching |
| TEST527 | tagged-urn/tagged-urn-js | js | `test527_best_match` | tagged-urn.test.js:469 | TEST527: Verify UrnMatcher finds best match among candidates |
| TEST528 | tagged-urn/tagged-urn-js | js | `test528_merge_and_subset` | tagged-urn.test.js:493 | TEST528: Verify merge and subset operations |
| TEST529 | tagged-urn/tagged-urn-js | js | `test529_merge_prefix_mismatch` | tagged-urn.test.js:506 | TEST529: Verify error when merging URNs with different prefixes |
| TEST530 | tagged-urn/tagged-urn-js | js | `test530_wildcard_tag` | tagged-urn.test.js:522 | TEST530: Verify wildcard value matching behavior |
| TEST531 | tagged-urn/tagged-urn-js | js | `test531_empty_tagged_urn` | tagged-urn.test.js:533 | TEST531: Verify empty URN (no tags) is valid and matches everything |
| TEST532 | tagged-urn/tagged-urn-js | js | `test532_empty_with_custom_prefix` | tagged-urn.test.js:551 | TEST532: Verify empty URN works with custom prefix |
| TEST533 | tagged-urn/tagged-urn-js | js | `test533_extended_character_support` | tagged-urn.test.js:562 | TEST533: Verify forward slashes and colons in tag components |
| TEST534 | tagged-urn/tagged-urn-js | js | `test534_wildcard_restrictions` | tagged-urn.test.js:569 | TEST534: Verify wildcard cannot be used as a key |
| TEST535 | tagged-urn/tagged-urn-js | js | `test535_duplicate_key_rejection` | tagged-urn.test.js:581 | TEST535: Verify duplicate keys are rejected with error |
| TEST536 | tagged-urn/tagged-urn-js | js | `test536_numeric_key_restriction` | tagged-urn.test.js:590 | TEST536: Verify purely numeric keys are rejected |
| TEST537 | tagged-urn/tagged-urn-js | js | `test537_empty_value_error` | tagged-urn.test.js:608 | TEST537: Verify empty values (key=) cause error |
| TEST538 | tagged-urn/tagged-urn-js | js | `test538_has_tag_case_sensitive` | tagged-urn.test.js:622 | TEST538: Verify hasTag value comparison is case-sensitive |
| TEST539 | tagged-urn/tagged-urn-js | js | `test539_with_tag_preserves_value` | tagged-urn.test.js:638 | TEST539: Verify withTag preserves value case |
| TEST540 | tagged-urn/tagged-urn-js | js | `test540_with_tag_rejects_empty_value` | tagged-urn.test.js:644 | TEST540: Verify withTag rejects empty value |
| TEST541 | tagged-urn/tagged-urn-js | js | `test541_builder_rejects_empty_value` | tagged-urn.test.js:653 | TEST541: Verify builder rejects empty value |
| TEST542 | tagged-urn/tagged-urn-js | js | `test542_semantic_equivalence` | tagged-urn.test.js:662 | TEST542: Verify unquoted and quoted simple lowercase values are equivalent |
| TEST543 | tagged-urn/tagged-urn-js | js | `test543_matching_semantics_exact_match` | tagged-urn.test.js:677 | TEST543: Instance and pattern have same tag/value - matches |
| TEST544 | tagged-urn/tagged-urn-js | js | `test544_matching_semantics_instance_missing_tag` | tagged-urn.test.js:684 | TEST544: Pattern requires tag but instance doesn't have it - no match |
| TEST545 | tagged-urn/tagged-urn-js | js | `test545_matching_semantics_extra_tag` | tagged-urn.test.js:694 | TEST545: Instance has extra tag not in pattern - still matches |
| TEST546 | tagged-urn/tagged-urn-js | js | `test546_matching_semantics_request_wildcard` | tagged-urn.test.js:701 | TEST546: Pattern has wildcard - matches any value |
| TEST547 | tagged-urn/tagged-urn-js | js | `test547_matching_semantics_cap_wildcard` | tagged-urn.test.js:712 | TEST547: An instance's wildcard promises presence, not the value asked for `ext=*` is "some ext". It does not satisfy a pattern asking for `ext=pdf` — that would let a cap promising some ext stand in for one that produces a pdf — while a pdf does satisfy a pattern asking for some ext. |
| TEST548 | tagged-urn/tagged-urn-js | js | `test548_matching_semantics_value_mismatch` | tagged-urn.test.js:720 | TEST548: Instance and pattern have same key but different values - no match |
| TEST549 | tagged-urn/tagged-urn-js | js | `test549_matching_semantics_pattern_extra_tag` | tagged-urn.test.js:727 | TEST549: Pattern has constraint instance doesn't have - no match |
| TEST550 | tagged-urn/tagged-urn-js | js | `test550_matching_semantics_empty_pattern` | tagged-urn.test.js:737 | TEST550: Empty pattern matches any instance |
| TEST551 | tagged-urn/tagged-urn-js | js | `test551_matching_semantics_cross_dimension` | tagged-urn.test.js:748 | TEST551: Multiple independent tag constraints work correctly |
| TEST552 | tagged-urn/tagged-urn-js | js | `test552_matching_different_prefixes_error` | tagged-urn.test.js:759 | TEST552: Matching URNs with different prefixes returns error |
| TEST553 | tagged-urn/tagged-urn-js | js | `test553_valueless_tag_parsing_single` | tagged-urn.test.js:787 | TEST553: Single value-less tag parses as wildcard |
| TEST554 | tagged-urn/tagged-urn-js | js | `test554_valueless_tag_parsing_multiple` | tagged-urn.test.js:794 | TEST554: Multiple value-less tags parse correctly |
| TEST555 | tagged-urn/tagged-urn-js | js | `test555_valueless_tag_mixed_with_valued` | tagged-urn.test.js:803 | TEST555: Mix of valueless and valued tags works |
| TEST556 | tagged-urn/tagged-urn-js | js | `test556_valueless_tag_at_end` | tagged-urn.test.js:813 | TEST556: Valueless tag at end (no trailing semicolon) works |
| TEST557 | tagged-urn/tagged-urn-js | js | `test557_valueless_tag_equivalence_to_wildcard` | tagged-urn.test.js:821 | TEST557: Valueless tag is equivalent to explicit wildcard |
| TEST558 | tagged-urn/tagged-urn-js | js | `test558_valueless_tag_matching` | tagged-urn.test.js:836 | TEST558: A valueless tag promises presence, not a value `ext` says the key is there with SOME value. It used to satisfy any pattern asking for a particular one — "decided later" — which made `ext` and `ext=pdf` refine each other, so they counted as equivalent, and a candidate promising only "some ext" was routed to a request needing a pdf. Refinement is inclusion of what each form allows: every pdf is some ext, not the reverse. |
| TEST559 | tagged-urn/tagged-urn-js | js | `test559_valueless_tag_in_pattern` | tagged-urn.test.js:848 | TEST559: Pattern with valueless tag requires instance to have tag (any value) |
| TEST560 | tagged-urn/tagged-urn-js | js | `test560_valueless_tag_specificity` | tagged-urn.test.js:863 | TEST560: Bare marker (=`x=*`) contributes 2 points; exact contributes 4. |
| TEST561 | tagged-urn/tagged-urn-js | js | `test561_valueless_tag_roundtrip` | tagged-urn.test.js:874 | TEST561: Valueless tags round-trip correctly (serialize as just key) |
| TEST562 | tagged-urn/tagged-urn-js | js | `test562_valueless_tag_case_normalization` | tagged-urn.test.js:884 | TEST562: Valueless tags normalized to lowercase |
| TEST563 | tagged-urn/tagged-urn-js | js | `test563_empty_value_still_error` | tagged-urn.test.js:893 | TEST563: Empty value with = is still error (different from valueless) |
| TEST564 | tagged-urn/tagged-urn-js | js | `test564_valueless_tag_compatibility` | tagged-urn.test.js:907 | TEST564: Valueless tags (wildcard) accept any specific value |
| TEST565 | tagged-urn/tagged-urn-js | js | `test565_valueless_numeric_key_still_rejected` | tagged-urn.test.js:921 | TEST565: Purely numeric keys still rejected for valueless tags |
| TEST566 | tagged-urn/tagged-urn-js | js | `test566_whitespace_in_input_rejected` | tagged-urn.test.js:935 | TEST566: Leading/trailing whitespace in input is rejected |
| TEST567 | tagged-urn/tagged-urn-js | js | `test567_unspecified_question_mark_parsing` | tagged-urn.test.js:972 | TEST567: All three input aliases (?x, x?, x=?) parse to stored value "?" and serialize as the canonical prefix form `?x`. |
| TEST568 | tagged-urn/tagged-urn-js | js | `test568_must_not_have_exclamation_parsing` | tagged-urn.test.js:980 | TEST568: All three input aliases (!x, x!, x=!) parse to stored value "!" and serialize as the canonical prefix form `!x`. |
| TEST569 | tagged-urn/tagged-urn-js | js | `test569_question_mark_pattern_matches_anything` | tagged-urn.test.js:987 | TEST569: Pattern with K=? matches any instance (with or without K) |
| TEST570 | tagged-urn/tagged-urn-js | js | `test570_question_mark_in_instance` | tagged-urn.test.js:1009 | TEST570: An instance with K=? promises nothing about K `?` is "no constraint", on either side. As an instance it used to satisfy every pattern ("whatever the pattern wants"), which made refinement non-transitive: missing ⪯ ?k ⪯ k=v, yet missing ⋠ k=v. It satisfies exactly the patterns that ask for nothing. |
| TEST571 | tagged-urn/tagged-urn-js | js | `test571_must_not_have_pattern_requires_absent` | tagged-urn.test.js:1032 | TEST571: Pattern with K=! requires the instance to SAY K is absent A key an instance does not mention is not a promise that it is absent: as a pattern the same omission means "anything", and one form cannot mean two things. `media:pdf` used to satisfy `media:pdf;!compressed` while `media:pdf;compressed` satisfied `media:pdf` — and not the `!compressed` pattern — so refinement was not transitive. |
| TEST572 | tagged-urn/tagged-urn-js | js | `test572_must_not_have_in_instance` | tagged-urn.test.js:1047 | TEST572: Instance with K=! conflicts with patterns requiring K |
| TEST573 | tagged-urn/tagged-urn-js | js | `test573_full_cross_product_matching` | tagged-urn.test.js:1068 | TEST573: Comprehensive test of all instance/pattern combinations Each form means the set of states it allows, on either side, and an instance satisfies a pattern when its set is inside the pattern's (capdag/formal, `tagMatch_iff_allows`). |
| TEST574 | tagged-urn/tagged-urn-js | js | `test574_mixed_special_values` | tagged-urn.test.js:1116 | TEST574: URNs with multiple special values work correctly |
| TEST575 | tagged-urn/tagged-urn-js | js | `test575_serialization_round_trip_special_values` | tagged-urn.test.js:1140 | TEST575: All special values round-trip correctly |
| TEST576 | tagged-urn/tagged-urn-js | js | `test576_compatibility_with_special_values` | tagged-urn.test.js:1157 | TEST576: Bidirectional accepts with special values |
| TEST577 | tagged-urn/tagged-urn-js | js | `test577_specificity_with_special_values` | tagged-urn.test.js:1190 | TEST577: Verify graded specificity with the six-form ladder. ?x=0, x?=v=1, x=*=2, x!=v=3, x=v=4, !x=5 |
| TEST599 | tagged-urn/tagged-urn-js | js | `test599_every_row_of_the_models_table` | tagged-urn.test.js:1282 | TEST599: every row of the proved model's table. The rules are proved in ../formal (Lean); this ties them to this mirror: every row of ../formal/conformance.json (written by the model, `lake exe conformance`) is parsed by this parser and must get the model's verdict. The same table runs in every mirror. |

