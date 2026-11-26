# Test catalogue — tagged-urn/tagged-urn-js

Generated from the test catalogue. Edit the tests, not this file.

118 tests: 118 numbered, 0 unnumbered.

## Numbered

| Number | Repository | Language | Test | Location | Description |
|---|---|---|---|---|---|
| TEST1 | tagged-urn/tagged-urn-js | js | `test0001_JsOnly_op_tag_rename` | tagged-urn.test.js:1334 | JS-only: Test marker tags are authored without an `action` key |
| TEST2 | tagged-urn/tagged-urn-js | js | `test0002_ConformsToStr` | tagged-urn.test.js:1351 | Test conformsToStr convenience method |
| TEST3 | tagged-urn/tagged-urn-js | js | `test0003_AcceptsStr` | tagged-urn.test.js:1360 | Test acceptsStr convenience method |
| TEST4 | tagged-urn/tagged-urn-js | js | `test0004_Canonical` | tagged-urn.test.js:1369 | Test canonical static method |
| TEST5 | tagged-urn/tagged-urn-js | js | `test0005_CanonicalOption` | tagged-urn.test.js:1378 | Test canonicalOption static method |
| TEST392 | tagged-urn/tagged-urn-js | js | `test392_least_upper_bound` | tagged-urn.test.js:1452 | TEST392: the bound of several URNs: the values they share, a key every one sets to differing values as the set of those values, the coarser of two comparable URNs, nothing for none, and another prefix refused |
| TEST501 | tagged-urn/tagged-urn-js | js | `test501_tagged_urn_creation` | tagged-urn.test.js:74 | TEST501: Verify basic URN creation from string with multiple tags |
| TEST502 | tagged-urn/tagged-urn-js | js | `test502_custom_prefix` | tagged-urn.test.js:83 | TEST502: Verify custom prefixes work and tags are sorted alphabetically |
| TEST503 | tagged-urn/tagged-urn-js | js | `test503_prefix_case_insensitive` | tagged-urn.test.js:91 | TEST503: Verify prefix is case-insensitive (CAP, cap, Cap all equal) |
| TEST504 | tagged-urn/tagged-urn-js | js | `test504_prefix_mismatch_error` | tagged-urn.test.js:106 | TEST504: Verify error when comparing URNs with different prefixes |
| TEST505 | tagged-urn/tagged-urn-js | js | `test505_builder_with_prefix` | tagged-urn.test.js:118 | TEST505: Verify builder pattern works with custom prefix |
| TEST506 | tagged-urn/tagged-urn-js | js | `test506_unquoted_values_lowercased` | tagged-urn.test.js:128 | TEST506: Verify unquoted values are normalized to lowercase |
| TEST507 | tagged-urn/tagged-urn-js | js | `test507_quoted_values_preserve_case` | tagged-urn.test.js:148 | TEST507: Verify quoted values preserve their case exactly |
| TEST508 | tagged-urn/tagged-urn-js | js | `test508_quoted_value_special_chars` | tagged-urn.test.js:165 | TEST508: Verify semicolons, equals, and spaces in quoted values are allowed |
| TEST509 | tagged-urn/tagged-urn-js | js | `test509_quoted_value_escape_sequences` | tagged-urn.test.js:177 | TEST509: Verify escape sequences in quoted values are parsed correctly |
| TEST510 | tagged-urn/tagged-urn-js | js | `test510_mixed_quoted_unquoted` | tagged-urn.test.js:192 | TEST510: Verify mixing quoted and unquoted values in same URN |
| TEST511 | tagged-urn/tagged-urn-js | js | `test511_unterminated_quote_error` | tagged-urn.test.js:199 | TEST511: Verify error on unterminated quoted value |
| TEST512 | tagged-urn/tagged-urn-js | js | `test512_invalid_escape_sequence_error` | tagged-urn.test.js:208 | TEST512: Verify error on invalid escape sequences (only \\" and \\\\ allowed) |
| TEST513 | tagged-urn/tagged-urn-js | js | `test513_serialization_smart_quoting` | tagged-urn.test.js:223 | TEST513: Verify smart quoting: quotes only when necessary |
| TEST514 | tagged-urn/tagged-urn-js | js | `test514_round_trip_simple` | tagged-urn.test.js:252 | TEST514: Verify simple URN round-trips correctly (parse -> serialize -> parse) |
| TEST515 | tagged-urn/tagged-urn-js | js | `test515_round_trip_quoted` | tagged-urn.test.js:261 | TEST515: Verify quoted values round-trip correctly |
| TEST516 | tagged-urn/tagged-urn-js | js | `test516_round_trip_escapes` | tagged-urn.test.js:271 | TEST516: Verify escape sequences round-trip correctly |
| TEST517 | tagged-urn/tagged-urn-js | js | `test517_prefix_required` | tagged-urn.test.js:281 | TEST517: Verify missing prefix causes error |
| TEST518 | tagged-urn/tagged-urn-js | js | `test518_trailing_semicolon_equivalence` | tagged-urn.test.js:303 | TEST518: Verify trailing semicolon is optional and doesn't affect equality |
| TEST519 | tagged-urn/tagged-urn-js | js | `test519_canonical_string_format` | tagged-urn.test.js:318 | TEST519: Verify canonical form: alphabetically sorted tags, no trailing semicolon |
| TEST520 | tagged-urn/tagged-urn-js | js | `test520_tag_matching` | tagged-urn.test.js:328 | TEST520: Verify hasTag and getTag methods work correctly |
| TEST521 | tagged-urn/tagged-urn-js | js | `test521_matching_case_sensitive_values` | tagged-urn.test.js:348 | TEST521: Verify value matching is case-sensitive |
| TEST522 | tagged-urn/tagged-urn-js | js | `test522_missing_tag_handling` | tagged-urn.test.js:370 | TEST522: Verify handling of missing tags in conformsTo semantics |
| TEST523 | tagged-urn/tagged-urn-js | js | `test523_specificity` | tagged-urn.test.js:403 | TEST523: Verify six-form per-tag specificity ladder. ?x        : 0 x?=v      : 1 x (=x=*)  : 2 x!=v      : 3 x=v       : 4 !x        : 5 |
| TEST524 | tagged-urn/tagged-urn-js | js | `test524_builder` | tagged-urn.test.js:428 | TEST524: Verify builder creates correct URN |
| TEST525 | tagged-urn/tagged-urn-js | js | `test525_builder_preserves_case` | tagged-urn.test.js:441 | TEST525: Verify builder preserves case in quoted values |
| TEST526 | tagged-urn/tagged-urn-js | js | `test526_compatibility` | tagged-urn.test.js:453 | TEST526: Verify directional accepts for URN matching |
| TEST527 | tagged-urn/tagged-urn-js | js | `test527_best_match` | tagged-urn.test.js:477 | TEST527: Verify UrnMatcher finds best match among candidates |
| TEST528 | tagged-urn/tagged-urn-js | js | `test528_merge_and_subset` | tagged-urn.test.js:501 | TEST528: Verify merge and subset operations |
| TEST529 | tagged-urn/tagged-urn-js | js | `test529_merge_prefix_mismatch` | tagged-urn.test.js:514 | TEST529: Verify error when merging URNs with different prefixes |
| TEST530 | tagged-urn/tagged-urn-js | js | `test530_wildcard_tag` | tagged-urn.test.js:530 | TEST530: Verify wildcard value matching behavior |
| TEST531 | tagged-urn/tagged-urn-js | js | `test531_empty_tagged_urn` | tagged-urn.test.js:541 | TEST531: Verify empty URN (no tags) is valid and matches everything |
| TEST532 | tagged-urn/tagged-urn-js | js | `test532_empty_with_custom_prefix` | tagged-urn.test.js:559 | TEST532: Verify empty URN works with custom prefix |
| TEST533 | tagged-urn/tagged-urn-js | js | `test533_extended_character_support` | tagged-urn.test.js:570 | TEST533: Verify forward slashes and colons in tag components |
| TEST534 | tagged-urn/tagged-urn-js | js | `test534_wildcard_restrictions` | tagged-urn.test.js:577 | TEST534: Verify wildcard cannot be used as a key |
| TEST535 | tagged-urn/tagged-urn-js | js | `test535_duplicate_key_rejection` | tagged-urn.test.js:589 | TEST535: Verify duplicate keys are rejected with error |
| TEST536 | tagged-urn/tagged-urn-js | js | `test536_numeric_key_restriction` | tagged-urn.test.js:598 | TEST536: Verify keys that begin with a digit are rejected and digits after the first letter are allowed |
| TEST537 | tagged-urn/tagged-urn-js | js | `test537_empty_value_error` | tagged-urn.test.js:618 | TEST537: Verify empty values (key=) cause error |
| TEST538 | tagged-urn/tagged-urn-js | js | `test538_has_tag_case_sensitive` | tagged-urn.test.js:632 | TEST538: Verify hasTag value comparison is case-sensitive |
| TEST539 | tagged-urn/tagged-urn-js | js | `test539_with_tag_preserves_value` | tagged-urn.test.js:648 | TEST539: Verify withTag preserves value case |
| TEST540 | tagged-urn/tagged-urn-js | js | `test540_with_tag_rejects_empty_value` | tagged-urn.test.js:654 | TEST540: Verify withTag rejects empty value |
| TEST541 | tagged-urn/tagged-urn-js | js | `test541_builder_rejects_empty_value` | tagged-urn.test.js:663 | TEST541: Verify builder rejects empty value |
| TEST542 | tagged-urn/tagged-urn-js | js | `test542_semantic_equivalence` | tagged-urn.test.js:672 | TEST542: Verify unquoted and quoted simple lowercase values are equivalent |
| TEST543 | tagged-urn/tagged-urn-js | js | `test543_matching_semantics_exact_match` | tagged-urn.test.js:687 | TEST543: Instance and pattern have same tag/value - matches |
| TEST544 | tagged-urn/tagged-urn-js | js | `test544_matching_semantics_instance_missing_tag` | tagged-urn.test.js:694 | TEST544: Pattern requires tag but instance doesn't have it - no match |
| TEST545 | tagged-urn/tagged-urn-js | js | `test545_matching_semantics_extra_tag` | tagged-urn.test.js:704 | TEST545: Instance has extra tag not in pattern - still matches |
| TEST546 | tagged-urn/tagged-urn-js | js | `test546_matching_semantics_request_wildcard` | tagged-urn.test.js:711 | TEST546: Pattern has wildcard - matches any value |
| TEST547 | tagged-urn/tagged-urn-js | js | `test547_matching_semantics_cap_wildcard` | tagged-urn.test.js:722 | TEST547: An instance's wildcard promises presence, not the value asked for `ext=*` is "some ext". It does not satisfy a pattern asking for `ext=pdf` — that would let a cap promising some ext stand in for one that produces a pdf — while a pdf does satisfy a pattern asking for some ext. |
| TEST548 | tagged-urn/tagged-urn-js | js | `test548_matching_semantics_value_mismatch` | tagged-urn.test.js:730 | TEST548: Instance and pattern have same key but different values - no match |
| TEST549 | tagged-urn/tagged-urn-js | js | `test549_matching_semantics_pattern_extra_tag` | tagged-urn.test.js:737 | TEST549: Pattern has constraint instance doesn't have - no match |
| TEST550 | tagged-urn/tagged-urn-js | js | `test550_matching_semantics_empty_pattern` | tagged-urn.test.js:747 | TEST550: Empty pattern matches any instance |
| TEST551 | tagged-urn/tagged-urn-js | js | `test551_matching_semantics_cross_dimension` | tagged-urn.test.js:758 | TEST551: Multiple independent tag constraints work correctly |
| TEST552 | tagged-urn/tagged-urn-js | js | `test552_matching_different_prefixes_error` | tagged-urn.test.js:769 | TEST552: Matching URNs with different prefixes returns error |
| TEST553 | tagged-urn/tagged-urn-js | js | `test553_valueless_tag_parsing_single` | tagged-urn.test.js:797 | TEST553: Single value-less tag parses as wildcard |
| TEST554 | tagged-urn/tagged-urn-js | js | `test554_valueless_tag_parsing_multiple` | tagged-urn.test.js:804 | TEST554: Multiple value-less tags parse correctly |
| TEST555 | tagged-urn/tagged-urn-js | js | `test555_valueless_tag_mixed_with_valued` | tagged-urn.test.js:813 | TEST555: Mix of valueless and valued tags works |
| TEST556 | tagged-urn/tagged-urn-js | js | `test556_valueless_tag_at_end` | tagged-urn.test.js:823 | TEST556: Valueless tag at end (no trailing semicolon) works |
| TEST557 | tagged-urn/tagged-urn-js | js | `test557_valueless_tag_equivalence_to_wildcard` | tagged-urn.test.js:831 | TEST557: Valueless tag is equivalent to explicit wildcard |
| TEST558 | tagged-urn/tagged-urn-js | js | `test558_valueless_tag_matching` | tagged-urn.test.js:851 | TEST558: A valueless tag promises presence, not a value `ext` says the key is there with SOME value. It used to satisfy any pattern asking for a particular one — "decided later" — which made `ext` and `ext=pdf` refine each other, so they counted as equivalent, and a candidate promising only "some ext" was routed to a request needing a pdf. Refinement is inclusion of what each form allows: every pdf is some ext, not the reverse. It is kept so this path is not taken again: with `ext` equivalent to both `ext=pdf` and `ext=docx`, equivalence was not transitive, and alias lookup and stream matching, which use it as "the same tag set", matched one for the other (tagged-urn formal, marker_is_not_exact). |
| TEST559 | tagged-urn/tagged-urn-js | js | `test559_valueless_tag_in_pattern` | tagged-urn.test.js:863 | TEST559: Pattern with valueless tag requires instance to have tag (any value) |
| TEST560 | tagged-urn/tagged-urn-js | js | `test560_valueless_tag_specificity` | tagged-urn.test.js:878 | TEST560: Bare marker (=`x=*`) contributes 2 points; exact contributes 4. |
| TEST561 | tagged-urn/tagged-urn-js | js | `test561_valueless_tag_roundtrip` | tagged-urn.test.js:889 | TEST561: Valueless tags round-trip correctly (serialize as just key) |
| TEST562 | tagged-urn/tagged-urn-js | js | `test562_valueless_tag_case_normalization` | tagged-urn.test.js:899 | TEST562: Valueless tags normalized to lowercase |
| TEST563 | tagged-urn/tagged-urn-js | js | `test563_empty_value_still_error` | tagged-urn.test.js:908 | TEST563: Empty value with = is still error (different from valueless) |
| TEST564 | tagged-urn/tagged-urn-js | js | `test564_valueless_tag_compatibility` | tagged-urn.test.js:922 | TEST564: Valueless tags (wildcard) accept any specific value |
| TEST565 | tagged-urn/tagged-urn-js | js | `test565_valueless_numeric_key_still_rejected` | tagged-urn.test.js:936 | TEST565: Purely numeric keys still rejected for valueless tags |
| TEST566 | tagged-urn/tagged-urn-js | js | `test566_whitespace_in_input_rejected` | tagged-urn.test.js:950 | TEST566: Leading/trailing whitespace in input is rejected |
| TEST567 | tagged-urn/tagged-urn-js | js | `test567_unspecified_question_mark_parsing` | tagged-urn.test.js:987 | TEST567: All three input aliases (?x, x?, x=?) parse to stored value "?" and serialize as the canonical prefix form `?x`. |
| TEST568 | tagged-urn/tagged-urn-js | js | `test568_must_not_have_exclamation_parsing` | tagged-urn.test.js:995 | TEST568: All three input aliases (!x, x!, x=!) parse to stored value "!" and serialize as the canonical prefix form `!x`. |
| TEST569 | tagged-urn/tagged-urn-js | js | `test569_question_mark_pattern_matches_anything` | tagged-urn.test.js:1002 | TEST569: Pattern with K=? matches any instance (with or without K) |
| TEST570 | tagged-urn/tagged-urn-js | js | `test570_question_mark_in_instance` | tagged-urn.test.js:1024 | TEST570: An instance with K=? promises nothing about K `?` is "no constraint", on either side. As an instance it used to satisfy every pattern ("whatever the pattern wants"), which made refinement non-transitive: missing ⪯ ?k ⪯ k=v, yet missing ⋠ k=v. It satisfies exactly the patterns that ask for nothing. |
| TEST571 | tagged-urn/tagged-urn-js | js | `test571_must_not_have_pattern_requires_absent` | tagged-urn.test.js:1047 | TEST571: Pattern with K=! requires the instance to SAY K is absent A key an instance does not mention is not a promise that it is absent: as a pattern the same omission means "anything", and one form cannot mean two things. `media:pdf` used to satisfy `media:pdf;!compressed` while `media:pdf;compressed` satisfied `media:pdf` — and not the `!compressed` pattern — so refinement was not transitive. |
| TEST572 | tagged-urn/tagged-urn-js | js | `test572_must_not_have_in_instance` | tagged-urn.test.js:1062 | TEST572: Instance with K=! conflicts with patterns requiring K |
| TEST573 | tagged-urn/tagged-urn-js | js | `test573_full_cross_product_matching` | tagged-urn.test.js:1083 | TEST573: Comprehensive test of all instance/pattern combinations Each form means the set of states it allows, on either side, and an instance satisfies a pattern when its set is inside the pattern's (capdag/formal, `tagMatch_iff_allows`). |
| TEST574 | tagged-urn/tagged-urn-js | js | `test574_mixed_special_values` | tagged-urn.test.js:1131 | TEST574: URNs with multiple special values work correctly |
| TEST575 | tagged-urn/tagged-urn-js | js | `test575_serialization_round_trip_special_values` | tagged-urn.test.js:1155 | TEST575: All special values round-trip correctly |
| TEST576 | tagged-urn/tagged-urn-js | js | `test576_compatibility_with_special_values` | tagged-urn.test.js:1172 | TEST576: Bidirectional accepts with special values |
| TEST577 | tagged-urn/tagged-urn-js | js | `test577_specificity_with_special_values` | tagged-urn.test.js:1205 | TEST577: Verify graded specificity with the six-form ladder. ?x=0, x?=v=1, x=*=2, x!=v=3, x=v=4, !x=5 |
| TEST578 | tagged-urn/tagged-urn-js | js | `test578_equivalent_identical_tags` | tagged-urn.test.js:1475 | TEST578: Equivalent URNs with identical tag sets |
| TEST579 | tagged-urn/tagged-urn-js | js | `test579_not_equivalent_when_one_more_specific` | tagged-urn.test.js:1483 | TEST579: Non-equivalent URNs where one is more specific |
| TEST580 | tagged-urn/tagged-urn-js | js | `test580_comparable_specialization_chain` | tagged-urn.test.js:1491 | TEST580: Comparable URNs on the same specialization chain |
| TEST581 | tagged-urn/tagged-urn-js | js | `test581_incomparable_different_branches` | tagged-urn.test.js:1499 | TEST581: Incomparable URNs in different branches of the lattice |
| TEST582 | tagged-urn/tagged-urn-js | js | `test582_equivalent_implies_comparable` | tagged-urn.test.js:1507 | TEST582: Equivalent implies comparable but not vice versa |
| TEST583 | tagged-urn/tagged-urn-js | js | `test583_prefix_mismatch_errors` | tagged-urn.test.js:1520 | TEST583: Prefix mismatch returns error for both relations |
| TEST584 | tagged-urn/tagged-urn-js | js | `test584_empty_tags_comparable_to_all` | tagged-urn.test.js:1528 | TEST584: Empty tag set is comparable to everything with same prefix |
| TEST585 | tagged-urn/tagged-urn-js | js | `test585_string_variants` | tagged-urn.test.js:1537 | TEST585: String variants of isEquivalent and isComparable |
| TEST586 | tagged-urn/tagged-urn-js | js | `test586_special_values` | tagged-urn.test.js:1546 | TEST586: Special values (*, !, ?) with isEquivalent and isComparable |
| TEST587 | tagged-urn/tagged-urn-js | js | `test587_builder_fluent_api` | tagged-urn.test.js:1569 | TEST587: Builder fluent API for tag manipulation |
| TEST588 | tagged-urn/tagged-urn-js | js | `test588_builder_custom_tags` | tagged-urn.test.js:1583 | TEST588: Builder with custom tags |
| TEST589 | tagged-urn/tagged-urn-js | js | `test589_builder_tag_overrides` | tagged-urn.test.js:1595 | TEST589: Builder tag overrides (last value wins) |
| TEST590 | tagged-urn/tagged-urn-js | js | `test590_builder_empty_build` | tagged-urn.test.js:1605 | TEST590: Builder empty build returns error (tags required) |
| TEST591 | tagged-urn/tagged-urn-js | js | `test591_builder_single_tag` | tagged-urn.test.js:1610 | TEST591: Builder with single tag |
| TEST592 | tagged-urn/tagged-urn-js | js | `test592_builder_complex` | tagged-urn.test.js:1618 | TEST592: Builder with complex multi-tag URN |
| TEST593 | tagged-urn/tagged-urn-js | js | `test593_builder_wildcards` | tagged-urn.test.js:1642 | TEST593: Builder with wildcards |
| TEST594 | tagged-urn/tagged-urn-js | js | `test594_builder_custom_prefix` | tagged-urn.test.js:1656 | TEST594: Builder with custom prefix |
| TEST595 | tagged-urn/tagged-urn-js | js | `test595_builder_matching_with_built_urn` | tagged-urn.test.js:1663 | TEST595: Builder matching with built URN |
| TEST596 | tagged-urn/tagged-urn-js | js | `test596_empty_delta_preserves_refinement` | tagged-urn.test.js:1685 | TEST596: Empty delta preserves a more specific concrete instance. |
| TEST597 | tagged-urn/tagged-urn-js | js | `test597_incomparable_replacement` | tagged-urn.test.js:1696 | TEST597: Incomparable replacement rewrites only declared coordinates. |
| TEST598 | tagged-urn/tagged-urn-js | js | `test598_comparable_removal` | tagged-urn.test.js:1706 | TEST598: Comparable removal drops only the declared key. |
| TEST599 | tagged-urn/tagged-urn-js | js | `test599_every_row_of_the_models_table` | tagged-urn.test.js:1421 | TEST599: every row of the proved model's table. The rules are proved in ../formal (Lean); this ties them to this mirror: every row of ../formal/conformance.json (written by the model, `lake exe conformance`) is parsed by this parser and must get the model's verdict, and every set of URNs in it the model's bound (leastUpperBound). The same table runs in every mirror. |
| TEST600 | tagged-urn/tagged-urn-js | js | `test600_every_model_function_carries_a_proved_claim` | tagged-urn.test.js:1397 | TEST600: every function of the proved model this mirror calls carries a proved claim. The model's package carries what is proved of each function it exports (its assurance document, generated from ../formal): each one decides, equals or keeps what its claim says, and none rests on an assumption about the host — the model needs none. |
| TEST6752 | tagged-urn/tagged-urn-js | js | `test6752_qualifier_value_alias` | tagged-urn.test.js:1724 | TEST6752: An unquoted value that begins with ? or ! is that qualifier (x=?v is x?=v, x=!v is x!=v); a quoted one is literal |
| TEST6753 | tagged-urn/tagged-urn-js | js | `test6753_prefix_and_key_are_identifiers` | tagged-urn.test.js:1748 | TEST6753: The prefix and every key are identifiers (an ASCII letter, then ASCII letters, digits and -), lowered, in parsing and in every constructor |
| TEST6754 | tagged-urn/tagged-urn-js | js | `test6754_every_value_reads_back` | tagged-urn.test.js:1778 | TEST6754: Every value a URN holds prints so that it reads back as itself |
| TEST6755 | tagged-urn/tagged-urn-js | js | `test6755_unquoted_value_takes_any_non_separator` | tagged-urn.test.js:1793 | TEST6755: An unquoted value takes any character but ; = \| " \ and whitespace |
| TEST6756 | tagged-urn/tagged-urn-js | js | `test6756_quoted_value_is_literal` | tagged-urn.test.js:1816 | TEST6756: A quoted value is the literal value: a quoted *, ? or ! is never a sigil, and a quoted ?=v is never a qualifier |
| TEST7210 | tagged-urn/tagged-urn-js | js | `test7210_admits_absence_by_form` | tagged-urn.test.js:1316 | TEST7210: A written tag lets its key be absent exactly when it is !k, ?k or k?=v; a key the URN does not mention says nothing of it, so it allows absence too. |
| TEST7223 | tagged-urn/tagged-urn-js | js | `test7223_urn_read_back_from_its_handle` | tagged-urn.test.js:1230 | TEST7223: A URN read back from its model handle is the URN: its prefix and every tag, each form and a quoted value included. |
| TEST7224 | tagged-urn/tagged-urn-js | js | `test7224_set_forms_parse_and_print` | tagged-urn.test.js:1242 | TEST7224: Each set form parses to the set it writes and prints canonically — values once, in increasing order, `!` last — reading back as itself; the qualifier aliases write the same sets. |
| TEST7225 | tagged-urn/tagged-urn-js | js | `test7225_set_forms_refused` | tagged-urn.test.js:1271 | TEST7225: A set of values refuses a value given twice, an empty member, a bare sigil or qualifier among its values, and `!` under a qualifier; a literal `\|` is quoted. |
| TEST7226 | tagged-urn/tagged-urn-js | js | `test7226_bound_is_exact_per_key` | tagged-urn.test.js:1288 | TEST7226: The bound of several URNs is exact per key: png and jpeg are bound by ext=jpeg\|png, a value and its absence by ext=v\|!, and a value and any value by ext. |
| TEST7227 | tagged-urn/tagged-urn-js | js | `test7227_set_scores` | tagged-urn.test.js:1299 | TEST7227: A set scores by what it allows — two or more values 3, absence and some values 1 — and narrowing never lowers a score, though two on one chain can tie. |
| TEST7241 | tagged-urn/tagged-urn-js | js | `test7241_urns_are_ordered_by_their_parts` | tagged-urn.test.js:1842 | TEST7241: URNs are ordered by their parts, never their text: the prefix, then each tag in key order by key, then by its constraint's form (unconstrained, optionalNot, present, presentNot, exact, absent), then by its value |

