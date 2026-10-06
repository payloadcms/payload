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
- [x] 3. SDK retired arguments: reject own deprecated keys draft/publishAllLocales/unpublishAllLocales before serialization. Files: SDK buildSearchParams.ts and SDK specs. Cover reads/writes and false values, confirm new selectors still serialize. Run SDK tests; review and commit.
- [x] 4. GraphQL container selectors: attach inherited document-version metadata to group/named-tab clones. Files: graphql fieldToSchemaMap.ts and GraphQL selector tests. Exercise implicit latest/draft relationship/upload inheritance and explicit overrides. Run GraphQL tests; review and commit.
- [x] 5. GraphQL create locale: propagate effective operation locale to returned document/child resolvers without changing shared root context. Files: graphql create resolver, document metadata utility, child resolvers and GraphQL tests. Cover French mutation response and multiple roots with different locales. Run GraphQL tests; review and commit.
- [x] 6. Nested-docs locale maps: build and repair breadcrumbs for each locale in all-locale creates. Files: plugin-nested-docs breadcrumb hooks and integration tests. Assert localized labels/URLs and repaired IDs in fresh published/latest reads, including single-locale control. Run nested-docs suite; review and commit.
- [x] 7. Vercel template strict draft consumers: use published/draft unions and missing-content guards matching the website template. Files: with-vercel-website page/post components, associated props and strict type verification. Generate strict types and run scaffold compiler; verify absent rich text renders safely; review and commit.

## Verification record

Append each task's red/green results, independent verdict, and commit. Final verification combines affected suites, local edit byte checks, and final diff review. Record unavailable adapters, browser/assistive-technology checks, and compiler limitations explicitly.

Task 1: Initial regressions failed; reviewer found point conversion, final hook values, document-wide locale validation, and editor storage interactions. All corrected. Final 138 SQLite selector tests and 11 field/editor unit tests pass. Independent review approved. MongoDB/Postgres not yet exercised.

Task 2: Initial restore regressions failed. Review corrections cover excluded locales, raw snapshot preservation, and scoped editor-hook suppression without changing GraphQL behavior. Final 9 restore integration and 3 editor unit controls pass; broader selector/version suite passed 285 tests and existing field/editor units passed 11. Scoped lint passes (two existing any warnings). Independent review approved. Commit follows task 1 commit 9750bf55ac.

Task 3: Seven initial regressions failed, then public disabled-error regression failed under review. Dedicated migration error now escapes read-error suppression. All 15 SDK tests, SDK typecheck, package lint and explicitly enabled test lint pass (five existing package warnings). Independent reviewer exercised 126 public method/key/value cases and 27 disabled-error cases; approved. Task 2 commit bed1a9cd71.

Task 4: Draft/latest container regressions failed before fix; all 59 GraphQL unit tests and 27 existing GraphQL/API integration tests pass. GraphQL typecheck exited zero; production and explicitly enabled spec lint pass. Independent review approved, including explicit overrides and nested array containers. Task 3 commit d9a169302f.

Task 5: Real French create-response regression failed with English related content. Final 28 SQLite GraphQL/API integration tests and 59 GraphQL unit tests pass; source typecheck/lint pass. Covers default-locale second-root isolation, grandchildren, explicit overrides, groups/tabs/arrays, hasMany/polymorphic children, uploads, joins and real Lexical population. Independent reviewer checked cycles, request proxies and dataloader separation; approved. Task 4 commit 5e07b05078.

Task 6: Five all-locale integration regressions failed initially; reviewer reproduced omitted localized values overwriting labels, row IDs and ancestor status. Three direct utility regressions failed before correction. Final 21 nested-doc integration tests and 4 unit tests pass, including filtered-locale breadcrumb preservation. Core declaration build and plugin typecheck pass; scoped source/spec lint passes. Independent review approved. Task 5 commit 86d928e426.

Task 7: Original strict compiler failed with three consumer type errors and the actual untitled-post rendering test reproduced an empty heading. Final actual Vercel configuration generated strict types with numeric IDs; compiler and four actual Page/Post rendering regressions pass, including a published query/access control. The new unit suite is included in the template aggregate test command. Browser inspection of actual rendered components with template CSS exposed white text without a hero image; foreground token and conditional gradient now preserve readable headings. Independent reviewer approved the final delta. Task 6 commit 1a130bef85.

Final verification: 316 SQLite integration tests, 54 focused MongoDB integration tests, 93 repository unit tests, and four standalone template component tests pass. Core declaration build, GraphQL/SDK/nested-docs typechecks, and actual Vercel strict scaffold typecheck pass. Native Next flat lint rules pass for changed template files; the template's preexisting FlatCompat configuration crashes while loading current Next rules. Source/spec lint for tasks 1–6 passed during each fix. Independent review approved each of the seven fixes. Original two local edits match saved bytes; temporary fixture override restored.

Scoped accessibility: assessed WCAG 2.2 A/AA 1.3.1, 1.3.2, 1.4.3, 1.4.10 and 2.4.6 for partial post markup. Browser tree retains a native level-one nonempty heading followed by body text; actual no-image foreground/canvas tokens give approximately 19.8:1 contrast, and 320 CSS pixel fixture has no horizontal overflow. Evidence: /private/tmp/payload-review-fixes/fix7-accessibility.json. This is a static fixture of real components and stylesheet, not a full deployed preview flow. Full Vercel build/deployment, Postgres integration tests, axe scan, manual theme/zoom/text-spacing review and assistive-technology speech were not exercised.
