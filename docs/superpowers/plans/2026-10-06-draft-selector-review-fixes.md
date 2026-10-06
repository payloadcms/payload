# Draft selector review fixes

**Goal:** Resolve the seven confirmed findings in PR #18501, sequentially, with an independent review after each fix.
**Architecture:** Retain the new version selectors and existing access boundaries. Extend existing validation and request metadata paths rather than repeating hooks or mutating shared GraphQL requests.
**Spec:** /private/tmp/payload-pr18501-review.md and /private/tmp/payload-pr18501-original-spec.md.
**Execution:** Implement in this session; each task gets failing regressions, focused verification, independent review, corrections, and its own commit. User has authorized execution; no additional approval gate.

## Constraints

Preserve the two existing local edits. Use shared integration fixtures. No AI attribution. Keep strictDraftTypes removal out of this branch. Do not fold another finding into a task's commit.

## Review focus

Validation failures must preserve live content; hooks must execute once; mixed locales and latest restores must retain draft exemptions; nested GraphQL selectors and locales must remain isolated per root; retired flags must fail before network I/O.

## Sequential tasks

- [x] 1. Field-hook publication validation: enable existing deferred validation in collection/global updates and propagate through locale-all traversal. Add collection/global invalid-draft and successful-publication regressions, asserting unchanged live content and one hook execution. Files: fields/hooks/beforeChange/index.ts, collections/operations/utilities/update.ts, globals/operations/update.ts, test/version-selector/publication-validation.int.spec.ts. Run version-selector integration suite and beforeChange unit tests; review and commit.
- [x] 2. Published restores: validate each locale actually promoted before storage, including global restores, while draft restores retain exemptions. Files: collection/global restoreVersion.ts and test/version-selector/restore-validation.int.spec.ts. Assert invalid nondefault locale rejects and preserves current live content; valid all-locale and draft controls. Run restore and selector integration suites; review and commit.
- [ ] 3. SDK retired arguments: reject own deprecated keys draft/publishAllLocales/unpublishAllLocales before serialization. Files: SDK buildSearchParams.ts and SDK specs. Cover reads/writes and false values, confirm new selectors still serialize. Run SDK tests; review and commit.
- [ ] 4. GraphQL container selectors: attach inherited document-version metadata to group/named-tab clones. Files: graphql fieldToSchemaMap.ts and GraphQL selector tests. Exercise implicit latest/draft relationship/upload inheritance and explicit overrides. Run GraphQL tests; review and commit.
- [ ] 5. GraphQL create locale: propagate effective operation locale to returned document/child resolvers without changing shared root context. Files: graphql create resolver, document metadata utility, child resolvers and GraphQL tests. Cover French mutation response and multiple roots with different locales. Run GraphQL tests; review and commit.
- [ ] 6. Nested-docs locale maps: build and repair breadcrumbs for each locale in all-locale creates. Files: plugin-nested-docs breadcrumb hooks and integration tests. Assert localized labels/URLs and repaired IDs in fresh published/latest reads, including single-locale control. Run nested-docs suite; review and commit.
- [ ] 7. Vercel template strict draft consumers: use published/draft unions and missing-content guards matching the website template. Files: with-vercel-website page/post components, associated props and strict type verification. Generate strict types and run scaffold compiler; verify absent rich text renders safely; review and commit.

## Verification record

Append each task's red/green results, independent verdict, and commit. Final verification combines affected suites, local edit byte checks, and final diff review. Record unavailable adapters, browser/assistive-technology checks, and compiler limitations explicitly.

Task 1: Initial regressions failed; reviewer found point conversion, final hook values, document-wide locale validation, and editor storage interactions. All corrected. Final 138 SQLite selector tests and 11 field/editor unit tests pass. Independent review approved. MongoDB/Postgres not yet exercised.

Task 2: Initial restore regressions failed. Review corrections cover excluded locales, raw snapshot preservation, and scoped editor-hook suppression without changing GraphQL behavior. Final 9 restore integration and 3 editor unit controls pass; broader selector/version suite passed 285 tests and existing field/editor units passed 11. Scoped lint passes (two existing any warnings). Independent review approved. Commit follows task 1 commit 9750bf55ac.
