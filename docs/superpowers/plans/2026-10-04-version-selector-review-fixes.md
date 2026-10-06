# Version Selector Review Fixes Implementation Plan

> **Execution:** Approved and implemented sequentially, followed by a fresh independent review and one fix pass. [Results and remaining limits](/Users/nlentz/.codex/worktrees/2e39/payload-core/docs/superpowers/plans/2026-10-04-version-selector-review-fixes-results.md).

**Goal:** Fix all eight confirmed review findings and prove the repaired behavior through durable regressions.

**Architecture:** Keep version selection explicit from the operation through storage and relationship population. Use a shared, schema-aware write helper for localized collection/global writes, preserve files referenced by retained copies, and correct individual consumers without broad refactoring.

**Tech Stack:** TypeScript, Payload Local API, GraphQL, pnpm, Vitest shared integration fixtures, MongoDB and SQLite, Playwright for the affected Admin flow.

**Spec:** [Paul's quest on draft: true](https://staging.figma.com/spec/pA1AyiAXKuEabcetircrIq/Paul-s-quest-on-draft--true?node-id=0-1). Findings and reproduction evidence: [fresh review](/private/tmp/payload-version-fresh-review.md). This plan addresses those findings; it does not claim the entire original breaking change is release-ready.

## Global Constraints

- Do not commit, push, create a PR, or change branches. This overrides the planning skill's suggested commit steps.
- Preserve the existing uncommitted implementation and unrelated work. Only this planning document is changed during planning.
- Public selector: `version?: 'latest' | 'published' | 'draft'`; `latest` is invalid for create.
- Omitted reads select published. Omitted create selects draft unless `_status: 'published'`; explicit create version wins over data. These draft defaults apply to entities with drafts enabled.
- Omitted update saves a draft. Explicit published edits live content and preserves pending work. Latest updates active work or its published fallback. `_status` controls the requested publication transition.
- Locale-all data is schema-aware and locale-keyed. Scalar publication status applies to all permitted locales. Keep access checks and publication field hooks authoritative.
- Dedicated publish/unpublish operations remain outside this fix scope.
- Use object parameters, separate type imports, shared slug constants, and focused functions. Do not add dependencies or unrelated API redesigns.
- Payload-backed tests use `test` from `test/__helpers/int/vitest.ts`, one root `test.suite`, and its initialized fixtures. Clean up files and any temporary configuration changes in hooks/finally blocks.
- Operations acting for an Admin/import user retain `overrideAccess: false`, `req`, and the authenticated `user`.

## Design Decisions and Review Focus

1. **Mixed-locale latest writes:** interpret the selected starting copy separately for each locale, following the spec's latest read rule. English pending work stays pending; French published work remains published when both are edited without `_status`. The spec does not show this exact write example, so this is an explicit proposed interpretation, pinned by Task 2.
2. **Shared, non-localized fields:** retain the current latest-read model: when an active draft supplies the shared fields, a mixed latest write puts shared edits in that pending copy. Do not leak them into live content merely because another locale targets published storage. Task 2 covers this distinction.
3. **File references:** status alone does not prove ownership. A pending snapshot may reference the live filename and generated sizes. Task 1 covers shared filenames, mixed localized statuses, and a failed replacement.
4. **Importer partial failures:** if a later locale fails, report that row as failed and exclude it from success counts. Earlier writes may already exist; this plan does not add importer-wide atomicity. Task 4 covers the failure and a subsequent valid row.
5. **Effective selector and projections:** core hooks, GraphQL root selections, nested relationships, aliases, and optimized locale-map selection must agree on the operation's effective selector and stored field name. Tasks 3, 6, and 7 cover these combinations.

## Task 1 — Protect published upload files (finding 1)

**Files:**

- Modify `packages/payload/src/collections/operations/utilities/update.ts` — replace the scalar-status deletion guard.
- Modify `packages/payload/src/uploads/deleteAssociatedFiles.ts` — support a set of filenames that must be retained; default behavior for other callers stays the same.
- Create `packages/payload/src/uploads/getReferencedUploadFilenames.ts` and its `.spec.ts` — collect base and generated-size filenames using the upload configuration and localized property shapes.
- Create `test/version-selector/collections/media.ts`, `test/version-selector/upload-config.ts`, and `test/version-selector/uploads.int.spec.ts`; add upload slugs to `slugs.ts`. Use the existing `test/versions/image.png` asset and clean up generated files after each test.

**Interfaces:** `getReferencedUploadFilenames({ collectionConfig, doc, localeCodes }): Set<string>` consumes a sanitized collection config and raw document. `deleteAssociatedFiles` gains optional `filenamesToPreserve?: ReadonlySet<string>` and excludes each protected filename independently, including sizes.

- [x] Add failing regressions named `should retain published upload files when replacing a localized draft`, `should retain shared published filenames when replacing an existing pending snapshot`, and `should retain published files when draft replacement validation fails`. Assert file bytes/base file/sizes still exist, published reads still reference them, and successful draft reads reference the replacement.
- [x] Add controls for scalar status, mixed localized publication status, localized upload properties, and ordinary replacement of an unreferenced draft file. Include a published-copy replacement whose old filename is still referenced by a retained pending copy.
- [x] Run `pnpm test:int:sqlite --run test/version-selector/uploads.int.spec.ts` and the filename helper unit file. Record the actual failing assertions before changing production code. **Ruling: real persistence/access regressions replace request-mirroring unit mocks.**
- [x] Read retained main/pending references using the same request and transaction before cleanup. A draft write protects the live copy; a published write that preserves a pending copy protects that snapshot. For mixed writes protect every copy/locale that is not being replaced. Do not infer safety from `docWithLocales._status === 'published'`. Exclude protected base files and sizes from deletion.
- [ ] Rerun these tests on SQLite and MongoDB. Ordinary cleanup must still remove unreferenced draft files. This task does not redesign historical-version file retention or transactional filesystem cleanup. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**

## Task 2 — Persist mixed-locale latest edits correctly (finding 2)

**Files:**

- Modify `packages/payload/src/collections/operations/updateByID.ts`, `update.ts` (bulk update), and `utilities/update.ts`.
- Modify `packages/payload/src/globals/operations/update.ts`.
- Create `packages/payload/src/versions/buildLocalizedVersionWrite.ts` and its `.spec.ts`.
- Reuse `versions/buildSingleLocalePublishData.ts`, `utilities/mergeLocalizedData.ts`, `versions/resolveVersionDocument.ts`, and `versions/saveVersion.ts`; change save/synchronization code only where needed to retain mixed pending/live state.
- Extend `test/version-selector/localized-data.int.spec.ts`, `globals.int.spec.ts`, and `query.int.spec.ts`.
- Document the selected mixed-write rule in `docs/versions/drafts.mdx`.

**Interfaces:** `buildLocalizedVersionWrite({ config, fields, currentDoc, selectedDoc, result, targetsByLocale }): { mainData: JsonObject | null; versionData: JsonObject; hasDraftLocales: boolean }`. `targetsByLocale` is a `Record<string, 'draft' | 'published'>` describing the starting copies; `result` is the authorized, field-processed result. The helper is pure and has no hooks or DB calls.

- [x] Add matching collection/global regressions named `should update each locale against its latest starting copy`. Publish `title: { en: 'Live English', fr: 'Live French' }`, create English pending work, then write latest/all titles `Edited English` and `Edited French` without `_status`. Assert returned/latest titles contain both edits; published English remains `Live English`; published French becomes `Edited French`; statuses remain English draft/French published; a French draft-only read has no active French draft.
- [x] Add separate checks for a partial French-only map, nested localized groups/arrays, shared summary edits, bulk collection updates, and all-published/all-draft starting states. For mixed shared edits, latest summary changes and published summary stays unchanged.
- [x] Add scalar publish-all/unpublish-all, denied `_status` access, denied target-copy update access, filtered locales, required published-locale validation, and hook-count checks. Hooks run once per document operation. Draft validation exemptions must not exempt a locale written to live storage.
- [x] Run the focused tests with SQLite and confirm the currently lost French edit/status change. Keep failures separate from any fixture or navigation failures.
- [x] Capture starting targets from the accessible selected document before applying status transitions. Run existing hooks once. After field access/hooks, build the live merge from current live data plus only authorized live-locale edits, preserving pending locales and shared pending fields. Build the active snapshot from edited pending locales plus the new live values for fallback locales. Scalar authorized status transitions override the destinations; an unauthorized transition cannot publish pending content.
- [x] Write main and version data inside the existing transaction. Keep one active marker and the existing history/max-version policy. Compose the returned latest result from the persisted copies rather than returning whichever DB write happened last. Do not implement this by recursively calling public updates once per locale.
- [ ] Rerun focused MongoDB/SQLite tests. Query, filter, sort, and count against edited French values must see the synchronized snapshot. A failure in either persistence step must not report success; exercise rollback on adapters supporting transactions and explicitly report other adapter limitations. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**

## Task 3 — Preserve the exact selector in global population (finding 3)

**Files:** Modify `packages/payload/src/globals/operations/findOne.ts`; extend `test/version-selector/config.ts` with a global relationship and `globals.int.spec.ts` with population regressions. Reuse collection slug constants.

**Interfaces:** Existing `afterRead({ ..., version: DocumentVersion })`; no new public API.

- [x] Add `should populate global relationships using the exact requested version`: a published-only child must not appear in a draft-only global read at depth 1; latest may resolve that published fallback. Also distinguish live and pending child titles for published/latest/draft global reads.
- [x] Run `pnpm test:int:sqlite --run test/version-selector/globals.int.spec.ts` and confirm draft-only population fails the assertion.
- [x] Forward `version` to the final field-level `afterRead` call, matching collection reads. Inspect other global afterRead invocations for the same omission without broadening unrelated code.
- [ ] Rerun on MongoDB and SQLite, including access-denied relationships so selector fallback cannot bypass read access. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**

## Task 4 — Keep localized draft upserts complete and report failures (finding 4)

**Files:** Modify `packages/plugin-import-export/src/import/batchProcessor.ts`; create `test/version-selector/imports.int.spec.ts` using the existing version-selector config and real batch processor.

**Interfaces:** Keep `createImportBatchProcessor(...).processImport(...)` and the existing `ImportResult` shape. Failed rows use its existing errors and counting path.

- [x] Add `should import every locale of a new draft upsert`: configure `defaultVersionStatus: 'draft'`, upsert English/French locale maps, and assert one successful import, no errors, both latest values persisted, and no published document.
- [x] Add a published creation control and `should report a row failure when a later locale write fails`. Reject French through fixture field validation; assert the failed row is not counted as imported/updated, its error includes locale/row context, and a following valid row still imports. Assert any earlier persisted data so the partial-write boundary is explicit.
- [x] Run `pnpm test:int:sqlite --run test/version-selector/imports.int.spec.ts` to reproduce the 404 and false success.
- [x] Use `version: 'latest'` for remaining locale writes in the new-document upsert branch, matching the existing create branch and preserving the newly created copy's status. Re-throw locale write errors with useful context to the outer row failure handler rather than swallowing them. Apply the same error-reporting rule to the other locale loops in this function.
- [ ] Rerun on MongoDB and SQLite. No-drafts imports and explicit publication requests must still work, and access-denied locale writes must produce errors rather than success counts. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**

## Task 5 — Match draft-only documents during imports (finding 5)

**Files:** Modify the matching `payload.find` in `packages/plugin-import-export/src/import/batchProcessor.ts`; extend `test/version-selector/imports.int.spec.ts` from Task 4.

**Interfaces:** Existing find call gains `version: 'latest'`; keep user/access parameters.

- [x] Add `should match an existing draft-only document during upsert`: repeat the same match-field import and assert the same ID and total count of one. Add `should update an existing draft-only match in update mode` and a pending-copy match-field value differing from its live value.
- [x] Run the focused importer tests before the lookup change and confirm duplication/not-found.
- [x] Select latest for matching. Preserve `overrideAccess: false`, request/user, invalid-ID handling, and the existing row-level failure behavior. A denied draft cannot silently fall back to live or become a duplicate through an access bypass.
- [ ] Rerun on MongoDB and SQLite, with published-only and access-constrained match controls. Review Tasks 4–5 together because they share this function. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**

## Task 6 — Align GraphQL creation metadata with core selection (finding 6)

**Files:** Modify `packages/graphql/src/resolvers/collections/create.ts` and `packages/payload/src/collections/operations/create.ts`; extend `test/version-selector/collections/posts.ts` with a direct self-relationship and `api.int.spec.ts` with mutation population regressions.

**Interfaces:** Keep the public create API unchanged. The core operation's final `resolvedVersion: 'draft' | 'published'`, after `beforeOperation`, is authoritative. Communicate it through the GraphQL operation's isolated `req.query.version`; use that value in `rememberDocumentVersion({ data, version })`.

- [x] Add `should populate a GraphQL create response as published when status publishes without a selector`. Create a published-only child; mutate a parent with `_status: published` and no version; assert published status and a populated child, then confirm a fresh published read.
- [x] Add explicit-version precedence cases: published with draft data and draft with published data. Add a default draft case, a beforeOperation hook that changes the selector, and concurrent GraphQL root mutations with different selectors. Each response must populate according to its own effective target.
- [x] Run `pnpm test:int:sqlite --run test/version-selector/api.int.spec.ts` and confirm the missing published relationship.
- [x] Give the resolver its own request query object as well as isolated transaction property. Remove its independent draft-default inference. Inside core create, record the final resolved selector on that operation request after beforeOperation resolution, before field processing. After creation, attach precisely that selector to returned objects. Do not force a precomputed explicit version that would defeat beforeOperation hooks or infer selection from a potentially hidden `_status` output field.
- [ ] Rerun SQLite/MongoDB API tests, including the existing default-create, rich-text population, and root-isolation cases. Confirm REST/Local create behavior is unchanged except consistent effective request metadata. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**

## Task 7 — Project the stored field for GraphQL locale companions (finding 7)

**Files:** Modify `packages/graphql/src/schema/buildObjectType.ts`; extend `test/version-selector/collections/localized-posts.ts` with a localized group and `api.int.spec.ts` with query projection regressions. `utilities/select.ts` should use its existing metadata path without special-casing companion names.

**Interfaces:** Each structured `<field>_locales` output carries `extensions.field` for the original Payload field. Preserve other applicable existing field extensions.

- [x] Add `should return locale companions with GraphQL selection enabled` for localized arrays and groups. Query only companions with `locale: all, select: true`; assert the full English/French maps and equality with select disabled. Use fresh reads so a mutation result cannot mask a missing DB projection.
- [x] Add alias/fragment selections and a combined original-field/companion selection, including nested localized structured fields where supported by the existing schema.
- [x] Run the API test file and confirm selected companions currently return null.
- [x] Attach underlying field metadata when building companion fields. Keep their resolver and JSON shape unchanged; let the existing projection builder map them to the stored name.
- [ ] Rerun MongoDB/SQLite API tests and `pnpm exec vitest run --project unit packages/graphql/src/schema/buildLocalizedTypes.spec.ts --no-cache`. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**

## Task 8 — Copy locales for entities without drafts (finding 8)

**Files:** Modify `packages/ui/src/utilities/copyDataFromLocale.ts`; create its colocated `.spec.ts` for request contracts and `test/version-selector/copy-locale.int.spec.ts` for real persistence. Add localized no-drafts collection/global fixtures to `collections/`, shared slugs, and `config.ts`. Extend the existing `test/a11y` config with a minimal localized no-drafts collection and add its browser scenario to `test/a11y/WCAG.e2e.spec.ts`.

**Interfaces:** Existing `copyDataFromLocale(args)` return shape stays unchanged. Choose draft only when the selected entity's config enables drafts; otherwise omit version and use ordinary update semantics.

- [x] Add `should copy locale data when collection drafts are disabled` and its global counterpart. Assert the destination data exists through a fresh read. For drafts-enabled entities, assert the copy creates/updates pending work and leaves live destination data unchanged.
- [x] Add access-denied copy tests and request-contract assertions retaining `overrideAccess: false`, `req`, and `user`. Do not weaken the new selector validator to make copying work.
- [x] Run `pnpm test:int:sqlite --run test/version-selector/copy-locale.int.spec.ts` and the helper's unit file before changing its selector. Confirm the collection's 400 is the failure, not Admin authentication setup. **Ruling: real persistence/access regressions replace request-mirroring unit mocks.**
- [x] Determine drafts capability once from the collection/global config and conditionally include `version: 'draft'`. Keep existing latest reads, merge behavior, localized row IDs, and error propagation.
- [ ] Rerun MongoDB/SQLite integration and helper unit tests. Exercise the actual no-drafts copy drawer with keyboard selection/submission, verify the persisted destination, success feedback, and focus retention/restoration. Add the main browser regression under WCAG 2.1.1; reuse existing status/error assertions and add missing behavior under their primary criteria. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**
- [x] Apply the `payload-accessibility` skill. Assess 1.3.1; 2.1.1/2.1.2; 2.4.3/2.4.6/2.4.7/2.4.11; 2.5.2/2.5.3; 3.2.1/3.2.2; 3.3.1–3.3.3; 4.1.2/4.1.3 for the successful/denied copy states. Run `pnpm test:e2e a11y --grep 'Copy to locale|copy locale' --workers=1`. Report automated results and outstanding human visual/screen-reader checks; do not claim conformance from API tests or axe alone.

## Execution Order and Verification Gates

Execute Tasks 1–8 sequentially. Task 1 removes the most severe file-loss path first; Task 2 establishes the shared localized persistence behavior. Task 5 extends Task 4's importer regression suite. The other consumer fixes are independently testable. Do not combine all changes before the first test run.

For every task: reproduce the reported failure, make the focused change, run the relevant tests, and inspect the diff against that finding. A regression test must assert externally observable results rather than repeat the implementation's selector calculation. Unit tests supplement real persistence tests.

After all tasks:

- [ ] Run `pnpm test:int --run test/version-selector test/versions` and `pnpm test:int:sqlite --run test/version-selector test/versions`. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**
- [ ] Run the importer integration suites: `pnpm test:int --run test/plugin-import-export` and the SQLite equivalent. Treat a previously existing failure separately, with evidence; do not silently count it as passing. **Verification incomplete: required local services unavailable; SQLite coverage is recorded in the results.**
- [x] Run the focused new helper unit files plus existing locale-schema, selector-parser, SDK-query, and UI locale-formatting unit tests. Run targeted core/API type checks, regenerate affected fixture types with the repository CLI, and review the resulting type diff. **Ruling: real persistence/access regressions replace request-mirroring unit mocks.**
- [x] Run formatting and lint on changed/new source files. Record exact commands and results. Do not expand to unrelated lint repairs.
- [x] Run the copy-locale browser regression and relevant existing accessibility scenarios. If browser/runtime prerequisites are unavailable, report this explicitly instead of substituting unit evidence.
- [x] Run the affected version-selector tests on PostgreSQL if a configured database is available; otherwise record that adapter as unverified. Do not install infrastructure as an unrequested part of these fixes.
- [x] Obtain a fresh independent review of all eight repairs using the review skill. Review both spec behavior and consumer integrations, with particular scrutiny of mixed persistence, file ownership, access constraints, and GraphQL request isolation. Fix any confirmed issues and rerun their affected checks.
- [x] Hand off a finding-by-finding status table, regression evidence, and remaining limitations. Keep all changes uncommitted and unpushed. Do not describe the full breaking change as release-ready based only on these repairs.

## Planning Self-Review

All eight findings have an owning task, concrete source locations, failing behavior, intended implementation, and verification. The five additional failure classes above are attached to those tasks. New interfaces use object parameters and remain internal; GraphQL uses the existing request-query selector and object metadata mechanism. The only material interpretation beyond the review is per-locale latest-write targeting and its shared-field rule, called out explicitly before implementation.

No production source, fixture, or test changes were made while preparing this plan. No tests were run during planning. Execution method and the mixed-write interpretation are for user review before work starts.
