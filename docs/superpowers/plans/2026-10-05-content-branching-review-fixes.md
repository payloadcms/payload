# Content Branching Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the confirmed non-file content-branching review findings, verify them on the official MongoDB and Drizzle adapters, and preserve the file findings for work after the file-versioning rebase.

**Architecture:** Use the existing branch status as the merge lock, preserve REST request identity in streamed work, and apply branch lifecycle access before internal state writes. Move official-adapter branch visibility from application-built ID lists to database-native registry lookups while retaining the existing fallback for external adapters.

**Tech Stack:** TypeScript, Payload Local API, MongoDB/Mongoose aggregation, Drizzle ORM for PostgreSQL and SQLite, Vitest integration and browser-component tests, TSTyche.

**Spec:** `docs/superpowers/specs/2026-10-05-content-branching-review-fixes-design.md`

## Global Constraints

- Do not change upload storage, upload deletion, upload cleanup, file versioning, file transformations, or cloud-storage behaviour in phase one.
- Do not add a merge token, ownership field, or adapter capabilities object.
- Name the native visibility activation boolean `useBranching`.
- Keep external adapter behaviour unchanged when branching is disabled or unsupported.
- Write and run each failing test before its implementation change.
- Use the current checkout. Do not create a worktree.
- Keep each large area in its own commit and do not add `Written with AI` to commit messages.

## Review Focus

- A failed `beforeMerge` hook after the status changes to `merging` must restore the branch to `open`; Task 1 tests this.
- A partial merge must restore the branch to `open` while a full merge becomes `merged` or `closed`; Task 1 tests this.
- A branch-created document has no main registry predecessor and must remain visible through native visibility; Tasks 4 and 5 test this.
- Relationship joins must apply visibility to the related collection instead of only the root query; Tasks 4 and 5 test this.
- Canonical distinct-ID pagination must use the same expression for values, sorting, and `totalDocs`; Tasks 4 and 5 test this.

---

### Task 1: Merge status exclusion and streamed REST context

**Files:**

- Modify: `test/branching/int.spec.ts`
- Create: `packages/payload/src/branching/merge/branchMergeStatus.ts`
- Modify: `packages/payload/src/branching/merge.ts`
- Modify: `packages/payload/src/branching/merge/finalizeMerge.ts`
- Modify: `packages/payload/src/branching/assertBranchWritable.ts`
- Modify: `packages/payload/src/branching/endpoints/merge.ts`

**Interfaces:**

- Produces: `startBranchMerge({ branchDocID, payload, req }): Promise<void>` and `restoreBranchAfterMergeError({ branchDocID, payload, req }): Promise<void>`; both use conditional database updates and no token.
- Produces: an isolated REST `PayloadRequest` for streamed merges with independent transaction and branch caches.
- Consumes: existing branch statuses `open`, `merging`, `merged`, and `closed`.

- [ ] **Step 1: Add failing merge-state integration tests**

Add tests named:

- `should allow only one concurrent merge while the branch status is merging` — pause the first merge in `beforeMerge`, start a second merge, assert the second rejects with 409, then release the first and assert the hook and main write each ran once.
- `should restore an open branch when a merge fails` — throw from `beforeMerge` and assert status `open`, main unchanged, and the pending change retained.
- `should reject writes while a branch is merging` — set status to `merging`, attempt a branch update, and assert `Forbidden`.
- `should return a partially merged branch to open` — merge a selected subset and assert pending changes remain with status `open`.

- [ ] **Step 2: Run the merge-state tests and confirm the old code fails**

Run: `pnpm test:int branching -t "concurrent merge|merge fails|branch is merging|partially merged branch"`

Expected: FAIL because both merges can proceed, `merging` is writable, or a partial merge does not set the required state.

- [ ] **Step 3: Implement the conditional status transition**

Implement `startBranchMerge` with `payload.db.updateOne({ branch: false, collection: branchesCollectionSlug, data: { status: 'merging' }, options: { atomic: true }, req, where: { and: [{ id: { equals: branchDocID } }, { status: { equals: 'open' } }] } })`. Throw `APIError` with status 409 when no row is returned. Implement error restoration as an ID-and-`merging` conditional update to `open`.

Claim after preparation finds applicable changes and before `beforeMerge`. On caught errors, release to `open`. Finalisation must write `open` when changes remain, otherwise `merged` or `closed`.

- [ ] **Step 4: Run the merge-state tests and confirm they pass**

Run: `pnpm test:int branching -t "concurrent merge|merge fails|branch is merging|partially merged branch"`

Expected: PASS.

- [ ] **Step 5: Add a failing streamed REST-context test**

Add `should preserve REST request identity and headers in a streamed merge`. Configure a merge access check or hook to record `req.payloadAPI` and a unique request header. Call the streamed endpoint and assert it observes `REST` and the header while using a request without the endpoint transaction ID.

- [ ] **Step 6: Run the REST test and confirm the old code fails**

Run: `pnpm test:int branching -t "preserve REST request identity"`

Expected: FAIL because the streamed merge creates a Local API request without the REST headers.

- [ ] **Step 7: Isolate the streamed request without losing REST identity**

Create a request derived from the endpoint request, remove `transactionID`, branch data-loader state, and request-scoped branch caches, then call `createPayloadRequest({ branch: false, payload, req: isolatedReq, user: req.user })`. Pass that request to `mergeBranch`.

- [ ] **Step 8: Run the focused Task 1 tests**

Run: `pnpm test:int branching -t "concurrent merge|merge fails|branch is merging|partially merged branch|preserve REST request identity"`

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add test/branching/int.spec.ts packages/payload/src/branching/merge/branchMergeStatus.ts packages/payload/src/branching/merge.ts packages/payload/src/branching/merge/finalizeMerge.ts packages/payload/src/branching/assertBranchWritable.ts packages/payload/src/branching/endpoints/merge.ts
git commit -m "fix: prevent overlapping branch merges"
```

### Task 2: Branch lifecycle update access

**Files:**

- Modify: `test/branching/config.ts`
- Modify: `test/branching/int.spec.ts`
- Create: `packages/payload/src/branching/assertBranchUpdateAccess.ts`
- Modify: `packages/payload/src/branching/merge.ts`
- Modify: `packages/ui/src/utilities/scheduleMergeHandler.ts`
- Modify: `packages/payload/src/index.ts`

**Interfaces:**

- Produces: `assertBranchUpdateAccess({ branchDoc, req }): Promise<void>`, including support for boolean and `Where` access results.
- Consumes: the sanitised branch collection `update` access rule, which already combines read and `updateBranch` access.

- [ ] **Step 1: Add failing lifecycle-access tests**

Configure a user who can read a branch but whose `updateBranch` access is false or a non-matching `Where`. Add tests:

- `should deny closeBranch when updateBranch access fails` and assert the merge does not close the branch;
- `should deny scheduling when updateBranch access fails` and assert no job is created;
- `should deny cancellation when updateBranch access fails` and assert the job remains.

- [ ] **Step 2: Run the lifecycle-access tests and confirm they fail**

Run: `pnpm test:int branching -t "updateBranch access"`

Expected: FAIL because readable users can currently close, schedule, or cancel.

- [ ] **Step 3: Implement and apply `assertBranchUpdateAccess`**

Call the collection update access function through `executeAccess`. For a `Where` result, query the target branch with both its ID and the access constraint. Use the helper before close requests, schedule creation, and cancellation. Keep internal status writes at `overrideAccess: true` only after this check.

- [ ] **Step 4: Run the focused lifecycle-access tests**

Run: `pnpm test:int branching -t "updateBranch access"`

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add test/branching/config.ts test/branching/int.spec.ts packages/payload/src/branching/assertBranchUpdateAccess.ts packages/payload/src/branching/merge.ts packages/ui/src/utilities/scheduleMergeHandler.ts packages/payload/src/index.ts
git commit -m "fix: enforce branch lifecycle update access"
```

### Task 3: Version history fork boundary

**Files:**

- Modify: `test/branching/int.spec.ts`
- Modify: `test/branching/payload-types.ts`
- Modify: `packages/payload/src/branching/collections.ts`
- Modify: `packages/payload/src/branching/forkDocument.ts`
- Modify: `packages/payload/src/branching/tombstone.ts`
- Modify: `packages/payload/src/branching/resolveBranch.ts`
- Modify: `packages/payload/src/branching/versions.ts`
- Modify: `packages/db-mongodb/src/findVersions.ts`
- Modify: `packages/db-mongodb/src/countVersions.ts`
- Modify: `packages/drizzle/src/findVersions.ts`
- Modify: `packages/drizzle/src/countVersions.ts`

**Interfaces:**

- Produces: `baseVersionUpdatedAt?: string` on branch-change rows and asynchronous `resolveBranchVersionHistoryQuery(...): Promise<Where | undefined>`.
- Consumes: existing `baseVersionID`, canonical parent IDs, and the branch-change manifest.

- [ ] **Step 1: Replace the history TODO with failing tests**

Create main version A, fork the document, then create main version B. Assert the branch history contains A and the branch version, excludes B, and `countVersions` equals the listed length. Add an update-to-delete case that asserts the boundary fields remain unchanged.

- [ ] **Step 2: Run the history tests and confirm they fail**

Run: `pnpm test:int branching -t "exclude main versions recorded after|preserve the version fork boundary"`

Expected: FAIL because later main versions are included and no version timestamp is stored.

- [ ] **Step 3: Record and preserve the base version boundary**

Add `baseVersionUpdatedAt` to the internal branch-change collection. On first fork or tombstone, read the latest main version and store its ID and timestamp. Preserve `baseVersionID`, `baseVersionUpdatedAt`, and `baseUpdatedAt` when a change changes operation. Regenerate the branching payload types and remove the existing trailing whitespace in that generated file.

- [ ] **Step 4: Make version-history filtering asynchronous and boundary-aware**

For requested canonical parents, combine branch-owned versions with main versions whose timestamp is at or before the recorded boundary, including the exact base version ID. Exclude main versions for branch-created documents and leave untouched-document and main-branch histories unchanged. Update both official adapter callers to await the resolver.

- [ ] **Step 5: Run the focused history tests**

Run: `pnpm test:int branching -t "exclude main versions recorded after|preserve the version fork boundary|count versions the same way"`

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add test/branching/int.spec.ts test/branching/payload-types.ts packages/payload/src/branching/collections.ts packages/payload/src/branching/forkDocument.ts packages/payload/src/branching/tombstone.ts packages/payload/src/branching/resolveBranch.ts packages/payload/src/branching/versions.ts packages/db-mongodb/src/findVersions.ts packages/db-mongodb/src/countVersions.ts packages/drizzle/src/findVersions.ts packages/drizzle/src/countVersions.ts
git commit -m "fix: bound branch version history at fork"
```

### Task 4: Drizzle-native branch visibility and canonical distinct IDs

**Files:**

- Modify: `test/branching/db-isolation.int.spec.ts`
- Modify: `test/branching/int.spec.ts`
- Create: `packages/drizzle/src/queries/buildBranchVisibility.ts`
- Modify: `packages/drizzle/src/find.ts`
- Modify: `packages/drizzle/src/findOne.ts`
- Modify: `packages/drizzle/src/count.ts`
- Modify: `packages/drizzle/src/findDistinct.ts`
- Modify: `packages/drizzle/src/find/findMany.ts`
- Modify: `packages/drizzle/src/find/buildPolymorphicJoinWhere.ts`
- Modify: `packages/drizzle/src/findVersions.ts`
- Modify: `packages/drizzle/src/countVersions.ts`
- Modify: `packages/payload/src/branching/resolveBranchQuery.ts`
- Modify: `packages/payload/src/branching/types.ts`
- Modify: `packages/payload/src/index.ts`

**Interfaces:**

- Produces: `resolveBranchReadState({ branch, collectionSlug, globalSlug, req }): { branch: string; useBranching: boolean }` and `buildBranchVisibility({ adapter, branch, collectionSlug, table }): SQL`.
- Preserves: `resolveBranchQuery` as the ID-list fallback for external adapters; `maxShadowedIDs` remains accepted but is deprecated for that fallback.

- [ ] **Step 1: Add failing cross-adapter visibility tests**

Create more shadowed documents than a deliberately low `maxShadowedIDs`. Assert correct filtered results, `totalDocs`, pagination, `findOne`, count, relationship joins, branch-created rows, deleted rows, and branch-version reads without a warning from the official adapter path. Add `findDistinct({ field: 'id' })` assertions that values, ordering, pagination, and `totalDocs` use canonical IDs.

- [ ] **Step 2: Run the PostgreSQL visibility tests and confirm they fail**

Run: `pnpm test:int:postgres branching -t "database-native branch visibility|canonical distinct IDs"`

Expected: FAIL because Drizzle still builds a growing `not_in` list and distinct IDs use physical row IDs.

- [ ] **Step 3: Implement shared branch-read activation**

Add `resolveBranchReadState` with `useBranching = enabled && branchable && branch !== MAIN_BRANCH && branch !== false`. Keep the existing main filter and external fallback. Mark `maxShadowedIDs` deprecated in the public type documentation without removing it.

- [ ] **Step 4: Implement Drizzle `NOT EXISTS` visibility**

Build correlated registry predicates against `payload-branch-changes`: main rows require no matching change; branch rows require the requested `_branch` and no matching delete operation. Apply the expression to root find, findOne, count, relationship and polymorphic joins, distinct queries, and version queries. Do not change non-branching query construction.

- [ ] **Step 5: Use the canonical ID expression throughout Drizzle distinct queries**

For `field === 'id'`, use `COALESCE(_branchDocID, id)` for `_selected`, ordering, grouping, and `countDistinct`.

- [ ] **Step 6: Run PostgreSQL and SQLite focused tests**

Run: `pnpm test:int:postgres branching -t "database-native branch visibility|canonical distinct IDs"`

Expected: PASS.

Run: `pnpm test:int:sqlite branching -t "database-native branch visibility|canonical distinct IDs"`

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add test/branching/db-isolation.int.spec.ts test/branching/int.spec.ts packages/drizzle/src packages/payload/src/branching/resolveBranchQuery.ts packages/payload/src/branching/types.ts packages/payload/src/index.ts
git commit -m "fix(drizzle): use database-native branch visibility"
```

### Task 5: MongoDB-native branch visibility and canonical distinct IDs

**Files:**

- Modify: `test/branching/db-isolation.int.spec.ts`
- Modify: `test/branching/int.spec.ts`
- Create: `packages/db-mongodb/src/queries/buildBranchVisibility.ts`
- Modify: `packages/db-mongodb/src/find.ts`
- Modify: `packages/db-mongodb/src/findOne.ts`
- Modify: `packages/db-mongodb/src/count.ts`
- Modify: `packages/db-mongodb/src/findDistinct.ts`
- Modify: `packages/db-mongodb/src/findVersions.ts`
- Modify: `packages/db-mongodb/src/countVersions.ts`
- Modify: `packages/db-mongodb/src/queries/buildSearchParams.ts`
- Modify: `packages/db-mongodb/src/utilities/buildJoinAggregation.ts`

**Interfaces:**

- Consumes: Task 4 `resolveBranchReadState` and `useBranching` semantics.
- Produces: `buildBranchVisibilityStages({ adapter, branch, collectionSlug, canonicalIDExpression }): PipelineStage[]` using indexed registry lookups.

- [ ] **Step 1: Run the MongoDB visibility tests and confirm they still fail**

Run: `pnpm test:int branching -t "database-native branch visibility|canonical distinct IDs"`

Expected: FAIL because MongoDB still builds a growing `not_in` list and returns physical IDs.

- [ ] **Step 2: Implement indexed MongoDB visibility stages**

Use `$lookup` against the branch-change collection with branch, collection slug, and string canonical document ID, then retain visible main rows with no change and requested-branch rows without a delete operation. Apply the stages before pagination, counting, and grouping in find, findOne, count, distinct, relationships, and version reads. Keep non-branching reads on the existing query path.

- [ ] **Step 3: Use canonical IDs throughout MongoDB distinct aggregation**

For `field === 'id'`, use `{ $ifNull: ['$_branchDocID', '$_id'] }` for grouping, sorting, paging, and counts.

- [ ] **Step 4: Run the focused MongoDB tests**

Run: `pnpm test:int branching -t "database-native branch visibility|canonical distinct IDs"`

Expected: PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add test/branching/db-isolation.int.spec.ts test/branching/int.spec.ts packages/db-mongodb/src
git commit -m "fix(db-mongodb): use database-native branch visibility"
```

### Task 6: Public Local API branch types

**Files:**

- Modify: `test/types/types.spec.ts`
- Modify: `packages/payload/src/collections/operations/local/duplicate.ts`
- Modify: `packages/payload/src/collections/operations/local/findDistinct.ts`
- Modify: `packages/payload/src/collections/operations/local/findVersionByID.ts`
- Modify: `packages/payload/src/collections/operations/local/restoreVersion.ts`
- Modify: `packages/payload/src/globals/operations/local/countVersions.ts`
- Modify: `packages/payload/src/globals/operations/local/findVersionByID.ts`
- Modify: `packages/payload/src/globals/operations/local/restoreVersion.ts`

**Interfaces:**

- Produces: `branch?: false | string` on each listed public option type.
- Consumes: existing runtime spread into `createPayloadRequest`.

- [ ] **Step 1: Add failing type assertions**

Add compile-time calls for every listed API with `branch: 'campaign'` and representative bypass calls with `branch: false`. Do not add runtime casts.

- [ ] **Step 2: Run the type test and confirm it fails**

Run: `pnpm test:types -- test/types/types.spec.ts`

Expected: FAIL with excess-property errors for `branch`.

- [ ] **Step 3: Add `branch?: false | string` to the public options**

Add the documented property only; runtime behaviour already flows through `createPayloadRequest`.

- [ ] **Step 4: Run the type test**

Run: `pnpm test:types -- test/types/types.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit Task 6**

```bash
git add test/types/types.spec.ts packages/payload/src/collections/operations/local/duplicate.ts packages/payload/src/collections/operations/local/findDistinct.ts packages/payload/src/collections/operations/local/findVersionByID.ts packages/payload/src/collections/operations/local/restoreVersion.ts packages/payload/src/globals/operations/local/countVersions.ts packages/payload/src/globals/operations/local/findVersionByID.ts packages/payload/src/globals/operations/local/restoreVersion.ts
git commit -m "fix: expose branch options on local APIs"
```

### Task 7: Merge outcome and changed-document accessibility

**Files:**

- Modify: `packages/ui/src/elements/MergeBranch/index.spec.tsx`
- Create: `packages/ui/src/views/Branch/ChangedDocuments/index.spec.tsx`
- Modify: `packages/ui/src/elements/MergeBranch/index.tsx`
- Modify: `packages/ui/src/elements/MergeBranch/MergeProgress/index.tsx`
- Modify: `packages/ui/src/elements/MergeBranch/types.ts`
- Modify: `packages/ui/src/views/Branch/ChangedDocuments/index.tsx`
- Modify: `packages/translations/src/languages/en.ts`
- Modify: `packages/translations/src/clientKeys.ts`
- Modify: generated `packages/translations/src/languages/*.ts`

**Interfaces:**

- Produces: terminal phases `complete`, `partial`, and `blocked`; blocked outcomes do not render a completed progress bar.
- Produces: stable diff-panel IDs, `aria-controls`, loading status text, hidden decorative shimmer, and error alerts.

- [ ] **Step 1: Add failing merge-outcome component tests**

Replace the `Merged 0 of 0` expectation with tests that a zero-merge blocked result renders `Merge blocked`, an alert with each blocked or validation reason, and no completed progressbar. Add a partial-result test that reports the actual merged count and problems without claiming full completion.

- [ ] **Step 2: Run the merge component tests and confirm they fail**

Run: `pnpm test:components packages/ui/src/elements/MergeBranch/index.spec.tsx`

Expected: FAIL because every outcome is currently treated as complete.

- [ ] **Step 3: Add failing changed-document semantic tests**

Render one row, expand it, and assert the toggle has `aria-controls` pointing to the diff panel. While the server function is pending, assert a loading status exists and the shimmer is hidden from assistive technology. Reject the function and assert the error has `role="alert"`.

- [ ] **Step 4: Run the changed-document tests and confirm they fail**

Run: `pnpm test:components packages/ui/src/views/Branch/ChangedDocuments/index.spec.tsx`

Expected: FAIL because the control relationship and live error/loading semantics are absent.

- [ ] **Step 5: Implement the UI state and accessibility changes**

Classify outcomes from `merged`, `blocked`, and `validationErrors`. Render successful, partial, and blocked titles and status messages. Use stable panel IDs and the semantic loading/error elements described by the spec.

- [ ] **Step 6: Generate translations**

The `generate-translations` skill applies here because this task adds client translation keys. Add English keys and client keys first, then run `cd tools/scripts && pnpm generateTranslations:core` when `OPENAI_KEY` is available. If it is unavailable, keep English and client keys correct and report untranslated generated files as a blocker rather than inventing translations.

- [ ] **Step 7: Run component and accessibility-focused tests**

Run: `pnpm test:components packages/ui/src/elements/MergeBranch/index.spec.tsx packages/ui/src/views/Branch/ChangedDocuments/index.spec.tsx`

Expected: PASS.

- [ ] **Step 8: Commit Task 7**

```bash
git add packages/ui/src/elements/MergeBranch packages/ui/src/views/Branch/ChangedDocuments packages/translations/src
git commit -m "fix(ui): report blocked branch merges accurately"
```

### Task 8: Phase-one verification, review, and push

**Files:**

- Modify only files required by Critical or Important final-review findings.

**Interfaces:**

- Consumes: all prior task outputs.
- Produces: a verified phase-one commit series on `origin/feat/content-branching`.

- [ ] **Step 1: Run focused MongoDB verification**

Run: `pnpm test:int branching`

Expected: PASS.

- [ ] **Step 2: Run required PostgreSQL integration verification**

Run: `pnpm test:int:postgres branching`

Expected: PASS.

- [ ] **Step 3: Run type, component, and changed-file checks**

Run: `pnpm test:types -- test/types/types.spec.ts`

Expected: PASS.

Run: `pnpm test:components packages/ui/src/elements/MergeBranch/index.spec.tsx packages/ui/src/views/Branch/ChangedDocuments/index.spec.tsx`

Expected: PASS.

Run: `git diff --check origin/feat/content-branching...HEAD`

Expected: no output and exit code 0.

- [ ] **Step 4: Request a final whole-branch code review**

Review the phase-one diff against the spec and this plan. Fix all Critical and Important findings with a failing test first; record deferred Minor findings for the final summary.

- [ ] **Step 5: Push phase one**

```bash
git push origin feat/content-branching
```

Expected: remote branch advances to the verified phase-one head.

## Phase Two: Rebase onto File Versioning

After phase one is pushed, fetch `origin/feat/file-versioning`, rebase `feat/content-branching` onto its latest head, resolve conflicts without discarding either feature, rerun the focused MongoDB tests and `pnpm test:int:postgres branching`, then push with `git push --force-with-lease origin feat/content-branching` because rebasing rewrites the branch history.

## Phase Three: File Handling Assessment

After the rebase, inspect the integrated file-versioning and transformer APIs, storage-adapter copy utilities, upload collection schema, branch copy/merge paths, and tests. Determine whether a non-main branch identifier in the stored filename or object key is sufficient across local and cloud adapters, how main promotion and branch cleanup transfer ownership, and how version restoration references stored files.

Do not implement phase three if the solution requires a new cross-adapter ownership model, destructive object migration, unresolved public schema changes, or other architecture not approved in the design spec. In that case, stop with an evidence-backed summary, proposed options, and the remaining file findings.
