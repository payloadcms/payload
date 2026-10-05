# Content Branching Review Fixes Design

## Purpose

Resolve every confirmed review finding for content branching except findings that affect upload files, stored objects, file versioning, or file transformations. The change must preserve the current branch data model, remain compatible with external database adapters when branching is disabled, and keep the current branch based on `main` rather than the file-versioning branches.

## Scope

This work covers merge concurrency, request context, lifecycle access, branch version history, database-side branch visibility, canonical distinct IDs, public Local API types, merge-result presentation, and changed-document accessibility.

This work does not change upload storage, upload deletion, upload cleanup, file versioning, file transformations, or cloud-storage behaviour. Those findings remain open for later work with the file-versioning changes.

## Merge Exclusivity

The branch `status` field is the only merge lock. No ownership token and no new branch field will be added.

After preparation finds changes that can be merged, the merge operation will conditionally update the branch row from `open` to `merging`. The update will use the branch row ID and `status = open` in one database update. If the update returns no row, the operation will return a conflict because the branch is not available for merge. The claim happens before `beforeMerge` hooks and before writes to main, so two requests cannot both run merge hooks or document writes.

Successful completion will change the status from `merging` to:

- `open` when pending changes remain;
- `merged` when no changes remain and the caller did not request closure; or
- `closed` when no changes remain and the caller requested closure.

If the merge request catches an error, it will restore `merging` to `open` before returning the error. An abrupt process end leaves persisted `merging` state for existing database and scheduled-job recovery paths. This change will not invent worker ownership or token recovery.

Writes to a branch in `merging` or `closed` state will be rejected. A `merged` branch will continue to reopen when its next change is recorded, as it does now.

Dry runs and merges with no applicable changes will not change branch status.

## Request Context for Streamed Merges

A streamed REST merge needs its own transaction lifecycle, but it must retain the calling REST request identity. The stream will create an isolated request derived from the incoming request, remove transaction-specific state, and initialise a new Payload request from that copy.

The isolated request will retain the authenticated user, headers, locale, request path, host information, REST API identity, and caller context. It will not reuse `transactionID`, the branch data-loader cache, or mutable branch state from the endpoint request. Streamed and non-streamed merge access functions and hooks will therefore observe equivalent REST request information.

## Branch Lifecycle Access

Operations that mutate branch lifecycle state will enforce the configured `updateBranch` access rule in addition to branch readability. This applies to:

- closing a branch as part of a merge;
- scheduling a merge; and
- cancelling a scheduled merge.

Access results that return a `Where` constraint will be checked against the target branch row. Internal status writes will continue to bypass field-level update restrictions only after lifecycle access succeeds, because the status field is intentionally not directly editable.

## Version History Boundary

The first change for a document on a branch will record the latest main version ID in the existing `baseVersionID` field and its version timestamp in a new `baseVersionUpdatedAt` field on the internal change registry. The existing `baseUpdatedAt` field will keep its current document-conflict meaning. All three base values will be retained when an update becomes a deletion.

Branch-aware collection version queries and counts will return:

- all branch versions for the requested branch;
- all main versions for untouched documents;
- no main versions for documents created on the branch; and
- only main versions at or before the recorded fork boundary for updated or deleted documents.

The exact base version ID will remain included when timestamp equality or database precision could otherwise exclude it. Main-branch queries and `branch: false` queries remain unchanged. Global version behaviour remains unchanged unless the existing global change data provides an equivalent boundary.

## Database-Native Branch Visibility

Official MongoDB and Drizzle adapters will no longer load all shadowed document IDs into an application-built `not_in` predicate. Each official adapter will implement its own database-native visibility condition using `payload-branch-changes` and its existing composite index on `branch`, `collectionSlug`, and `documentID`.

For a non-main branch:

- a main row is visible only when no change registry row exists for the same branch, collection, and canonical document ID;
- a branch row is visible only when it belongs to the requested branch and its registry operation is not `delete`;
- a branch-created row remains visible through its own canonical ID; and
- filtering, pagination, sorting, counting, joins, relationships, distinct queries, and version queries use the same visibility rules.

Drizzle adapters will use a correlated `NOT EXISTS` expression or an equivalent anti-join. MongoDB will use an indexed `$lookup` or equivalent aggregation. Database-specific query construction will stay inside the official adapter packages. Payload may expose a shared input type and a helper that resolves the branch-read state, but it will not generate one query representation for SQL and MongoDB.

The activation boolean will be named `useBranching`. It is true only when branching is enabled, the target collection or global is in the sanitised branchable set, the request targets a non-main branch, and the request has not set `branch: false`. Main reads keep the existing `_branch = 'main'` predicate without the change-registry lookup. When branching is disabled, official adapter query paths remain unchanged.

The existing optional `branch` adapter arguments remain the compatibility boundary. No adapter `capabilities` object will be added. External adapters may continue to ignore the argument when they do not support branching.

`maxShadowedIDs` will remain accepted for backwards compatibility and will be marked as deprecated for fallback adapter paths. Official adapters will not use it after database-native visibility is active. The implementation will not replace `not_in` with many `not_equals` conditions because that does not solve parameter or query-size limits.

## Canonical Distinct IDs

For branch-aware `findDistinct({ field: 'id' })`, selection, deduplication, sorting, and counting will use the canonical ID expression throughout:

- MongoDB: `$ifNull` over `_branchDocID` and `_id`;
- Drizzle: `COALESCE(_branchDocID, id)`.

Physical shadow-row IDs must not appear in public results.

## Public Local API Types

The public option types for branch-aware Local APIs will accept `branch?: false | string` where runtime support already exists. This includes duplicate, `findDistinct`, collection version lookup and restore, and global version count, lookup, and restore operations. Type tests will confirm accepted branch strings and the `false` bypass.

## Merge Result Interface

A completed response with blocked changes or validation errors and no merged changes is a blocked merge, not a successful merge. The admin interface will use separate terminal states for successful, partial, and blocked outcomes.

A blocked outcome will:

- use a blocked title and message;
- expose the error summary with an alert role;
- not show 100% completion; and
- retain the reasons returned by the API.

A partial outcome will report the actual merged count and remaining problems. A successful outcome will keep the current completion presentation. New English translation keys will be added and generated for other supported languages with the repository translation workflow.

## Changed-Document Accessibility

Expandable change rows will connect their control and content with stable IDs and `aria-controls`. Loading content will have a text status announced through a live region while decorative shimmer content is hidden from assistive technology. Diff-load errors will use an alert role and remain associated with the expanded content.

The affected behaviour will be checked against WCAG 2.2 Level A and AA, including 1.3.1 Info and Relationships, 3.3.1 Error Identification, 4.1.2 Name, Role, Value, and 4.1.3 Status Messages. Automated component or end-to-end assertions will cover semantics. Manual keyboard and screen-reader checks will be reported when automated checks cannot prove announcement behaviour.

## Testing and Commit Structure

Every change will follow a red-green cycle: add a focused failing test, run it and confirm the expected failure, make the smallest implementation change, then rerun the focused test.

Large areas will use separate commits:

1. merge status exclusivity and REST request preservation;
2. branch lifecycle access;
3. version history boundary;
4. native MongoDB and Drizzle branch visibility plus canonical distinct IDs;
5. public Local API types;
6. merge result and accessibility changes; and
7. final review fixes, if required.

Focused integration tests will cover MongoDB, PostgreSQL, and SQLite where adapter behaviour differs. Final verification will include the affected integration suites, unit or component tests, type checks, accessibility evidence, formatting or lint checks for changed files, and a fresh review of the complete branch diff.

The completed commit series will be pushed directly to `origin/feat/content-branching` after verification.

## Deferred Findings

The following work remains deliberately deferred:

- branch isolation for upload file data;
- deletion and cleanup of physical upload files and cloud objects;
- interactions with the file-versioning branch; and
- interactions with the file-transformations pull request.

No code in those paths will be changed as part of this implementation.
