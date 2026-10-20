Written with AI

# Implementation plan: content branching for external database adapters

Audience: maintainers of database adapters outside this repository. Status: implementation and verification plan based on the current experimental branching code; not a declaration that external adapters have been audited or certified.

## Scope and compatibility boundary

Branching changes storage identity, reads, writes, versions, uniqueness, globals, and transaction behavior. Implementing a branch filter on `find` alone is insufficient.

This PR removes `maxShadowedIDs` from public and sanitized config and removes its warning. No replacement adapter method is required for that removal. Existing manifest-backed helpers continue filtering as before.

The eventual retirement of manifest-based read predicates is a separate proposed architecture change. Sections explicitly marked “retirement target” describe that future requirement; no capability flag or native-visibility hook is currently defined on `BaseDatabaseAdapter`.

Adapters reusing the official MongoDB/Drizzle implementations can inherit relevant behavior, but must audit overridden methods and backend differences. Independent adapters need equivalent behavior, not identical SQL or aggregation syntax. Pin and test against the exact experimental Payload revision supported by the adapter.

## Phase 1 — Inventory the adapter and establish ownership

Create a method matrix covering collection CRUD, copy, counts, distinct values, globals, versions, draft queries, joins, relationship predicates, schema generation, migrations, and transactions. Include optimized/atomic paths and direct query builders, not only exported methods.

Core handles collection/global/field access, hooks, validation, branch lifecycle authorization, and merge orchestration. The adapter must preserve the request/transaction context it receives and implement storage/query semantics. Adapter requests may omit the user; do not duplicate application authorization based on an assumed complete HTTP request.

Core's branchable entity sets determine participation. Auth collections and the three branch-state collections cannot branch; most other internal collections default off. Preserve disabled/excluded behavior. Current custom-ID and multi-tenant plugin limitations are not lifted by writing an adapter.

Deliverable: a support matrix with each method's implementation owner and a list of unsupported capabilities. Decide how unsupported branching is surfaced rather than returning incomplete results.

## Phase 2 — Storage, schema, and migrations

Persist the injected field definitions and their actual ID types:

| Storage | Branch fields | Identity requirements |
| --- | --- | --- |
| Collection content | `_branch`, `_branchDocID` | Physical row ID differs from logical ID for copies; branch-created content uses its own ID. |
| Collection versions | `_branch`, `_branchParent` | Stored `parent` identifies the physical parent; `_branchParent` retains the logical document identity. |
| Global content | `_branch` | At most one stored row per global/branch. |
| Global versions | `_branch` | Independent branch version streams. |

- Main uses the non-null sentinel `'main'`. Backfill existing content/global/version rows before enabling application code that expects it.
- Register and store `payload-branches`, `payload-branch-changes`, and `payload-branch-merges` using their current generated schema. Do not branch these collections.
- Preserve both relationship identities and the change record's text `documentID` representation; native visibility uses the latter for cross-ID-type lookup. Normalize numeric/text identifiers consistently.
- Implement branch-scoped unique fields and developer compound indexes. Do not retain an old unscoped unique index that rejects branch copies.
- Enforce one copy per logical document/branch and one pending change per relevant document/global identity. Required-field/partial-index semantics matter: nullable main `_branchDocID` values must not collide.
- Respect `CompoundIndex.requireExists` where the backend needs partial uniqueness semantics. Do not copy MongoDB behavior blindly onto a backend with different NULL handling.
- Include nested/localized unique fields and upload filename compound indexes in schema review.
- Generate/review migrations, detect uniqueness conflicts before destructive index replacement, and document rollout ordering and rollback limitations.

Acceptance: an existing main dataset migrates without disappearing from reads; identical unique values can exist on separate branches, while conflicts within one branch and on main remain enforced.

## Phase 3 — Branch selection and identity

- Accept the relevant method's `branch` argument and request branch context. Explicit Local API overrides take precedence; omitted context defaults to main. Use shared branch-state helpers where applicable.
- Distinguish main-only reads from `branch: false` and the request bypass marker. Internal bypass operations must access raw physical rows and must not project logical IDs over them.
- Do not load Admin preferences inside adapter operations. Admin resolves its saved selection separately.
- Rewrite logical-ID filters to resolve the visible row and preserve logical IDs in ordinary results. Preserve numeric ID types and nested/populated relationship identities.
- Retain identity fields needed for projection even when callers use narrow `select`; avoid exposing physical IDs because a select dropped bookkeeping.
- Propagate branch and transaction/session context to related reads. Keep branch state and caching isolated across explicit overrides and concurrent GraphQL roots through the core contracts.

Reference helpers include `resolveBranchReadState`, `rewriteBranchIDs`, `withBranchIDSelect`, `applyBranchIDProjection`, and `resolveBranchRowID`. Exported helpers are experimental; confirm their exact signatures at the pinned revision.

## Phase 4 — Collection reads and query composition

Implement the visible set as main rows with no matching active-branch change plus branch-owned rows without an authoritative delete change. Match by branch, collection, and canonical identity; never include unrelated branches.

| Path | Required behavior |
| --- | --- |
| `find` / `findOne` | Correct visible row, logical identity, filtering, selection, pagination, and sorting. |
| `count` | Same visible set as the corresponding list, including trash/draft predicates. |
| `findDistinct` | Compute unique values, ordering, and counts from visible rows and visible related rows. |
| Relationship predicates / sorting | Join or query the correct branch-visible related row rather than stale main or unrelated branch rows. |
| Joins / reverse relationships | Correct logical matching, nested filters, pagination, populated rows, and join counts. |

Visibility must precede limit/offset, aggregation, and total-count computation. Post-filtering fetched pages is not equivalent. Preserve access/user filters alongside branch constraints. Cover polymorphic and has-many relationships and backend paths that disable join aggregation.

Current integration: adapters may use manifest-backed shared predicates where supported. Retirement target: replace those read predicates with database-native existence/lookup logic or an equivalent backend strategy without whole-manifest enumeration or branch-size-proportional filter arrays.

Official references: `packages/drizzle/src/queries/buildBranchVisibility.ts`, `packages/db-mongodb/src/queries/buildBranchVisibility.ts`, and their find/count/distinct/relationship callers.

## Phase 5 — Writes, copy-on-write, and deletion

- Implement `copy` without re-entering Local API lifecycles. The provided default reads the raw source, copies content, refreshes nested array/block row IDs, and creates a physical row. Verify it fits the backend or override it equivalently.
- Honor the supplied transaction for physical copy creation and change registration; do not commit an independent copy behind the caller's back.
- Concurrent first writes must not create duplicate copies/change records. Translate uniqueness and transaction errors into the forms expected by the core retry/recovery paths, or coordinate an explicit supported mapping.
- `updateOne` must resolve logical IDs to the appropriate physical row, preserve branch ownership, and respect raw bypass. Preserve optimized and atomic paths as well as ordinary updates.
- Preserve atomic conditional updates used by branch lifecycle guards. A read followed by an unguarded write is not equivalent to compare-and-update semantics.
- Implement `deleteOne` integration with core branch-deletion resolution: inherited content is hidden by a tombstone/change record; branch-created content can be physically deleted subject to reference checks. Do not delete main merely because its logical ID was supplied on a branch.
- Audit bulk update/delete and direct database operations so core-provided raw predicates and selected physical IDs remain correct. Do not assume every bulk helper has a new `branch` parameter.
- Preserve successful return values, logical projection, array/block identities, localization, and publication status semantics.

Current limitation: first update/delete/restore of an untouched branch document in a caller-owned transaction can return `409`. Do not independently bypass this guard in an adapter. Supporting caller-owned first copies is separate core work; after it lands, follow its ownership/retry contract.

Acceptance: first copy, later edit, concurrent first edit, branch deletion, bulk operations, and rollback do not mutate or lose main content unexpectedly.

## Phase 6 — Versions, drafts, and restoration

- `createVersion` associates a branch version with its physical parent and stores logical parent metadata and branch identity.
- Scope latest-version flags, autosaves, retention, and deletion to the correct parent/branch. A branch save must not clear main's latest draft.
- `queryDrafts` returns the visible latest draft as logical documents, suppressing deleted content and shadowed main drafts.
- `findVersions` and `countVersions` use matching branch-history semantics: branch-owned history plus permitted inherited main history through the fork boundary (`baseVersionID` / `baseVersionUpdatedAt`). Do not replace this with a simple current-document filter.
- Single-version reads/restores inherit the same branch scoping; internal recovery must be able to retrieve exact raw target version IDs.
- Preserve logical `parent` in normal collection version results and selection-aware projection. Version-response metadata shaping is a separate core API concern; do not remove stored `_branchParent` because a future response-shaping change hides it.
- Check localized drafts/status, Trash transitions, restore paths, pruning, and branch cleanup. Merge applies the latest draft/published source state; it does not inherently publish drafts.

Retirement target: native version-history/draft visibility as well as native ordinary reads. Keep any manifests needed for writes/bookkeeping until separately replaced.

## Phase 7 — Globals and their versions

- `findGlobal` must prefer the branch-owned singleton and inherit main when untouched. Shared helpers can fetch at most the two eligible rows and select the branch row.
- `updateGlobal` must seed the first branch row from main, apply submitted fields, and stamp branch identity. Handle concurrent first writes without silently reverting fields from another writer; audit `branchConflictData` support in the adapter argument type.
- `deleteBranchGlobal` is optional in the base type but required by the branch-global cleanup path when used. Implement it before claiming complete global merge/discard support.
- `upsertBranchGlobalChange` is an optional atomic hook. Core has a fallback registration path; if relying on it, prove concurrent correctness and lifecycle/reopen behavior or implement the hook.
- Scope global version creation, latest flags, list, count, retention, and restore to the selected branch. Global version history is a separate branch stream, unlike collection inherited-history rules.
- Audit `countGlobalVersions` directly; do not assume the caller always supplies a branch predicate or that list filtering automatically applies to counts.

Acceptance: concurrent global writes, main read-through, drafts, merge/discard, and version counts agree with their list/read counterparts.

## Phase 8 — Transactions, merges, files, and recovery

- Implement `beginTransaction`, `commitTransaction`, and `rollbackTransaction` truthfully. Return no transaction when unavailable rather than advertising atomic guarantees the backend cannot provide.
- Reuse supplied transaction/session identity for content, related rows, versions, and change registration. Nested operations must not commit or abort a transaction they do not own.
- Surface failed, transient, and unknown commit outcomes accurately. Core uses commit/rollback completion to coordinate deferred cleanup and recovery; never report success for an uncertain commit.
- Verify transaction isolation and concurrent first-copy behavior with the core's retry strategy. Document backend-specific retry requirements.
- Preserve stable IDs when branch-created content is promoted to main. Merge needs normal access/validation/hooks at the core layer and genuine target versions; storage methods must not bypass that orchestration by re-entering a separate lifecycle.
- Persist merge ledger data, exact before/after target version references, and application/recovery/cleanup outcomes without truncating or coercing identities incorrectly.
- Where transactions are unavailable, verify best-effort recovery and retain the documented possibility of partial visibility. Do not promise automatic repair of unknown outcomes.
- Upload metadata is adapter storage; file bytes are managed through Payload/local/cloud file operations. Preserve branch-specific metadata, filenames, prefixes, versions, and reference relationships so merge/discard/deletion cannot clean up files owned elsewhere. A database transaction does not itself roll back external storage.
- Exercise deferred file cleanup on commit, rollback, cleanup failure, and retry, including surviving document/global/version references.

Scheduling uses the same merge engine with execution-time user/content checks; there is no implemented scheduled content-freeze state. No new database scheduling interface is required. Do not invent status transitions inconsistent with core.

## Phase 9 — Retire manifest-backed read predicates (future architecture task)

Coordinate with core before removing shared helpers. Implement native visibility for every path in Phases 4 and 6, including aliases, subqueries, nested joins, and counts. Core branch-delete target lookup must also stop precomputing a manifest-based predicate before a raw adapter read.

Do not delete change records or all request manifests: merge/discard and write bookkeeping still need authoritative pending changes. The target is scalable read predicate construction, not elimination of the branch-change registry.

Agree a capability/versioning transition and fail clearly for unsupported adapters. No such capability hook exists today. See [MANIFEST_READ_PREDICATES_FOLLOWUP.md](MANIFEST_READ_PREDICATES_FOLLOWUP.md) for core changes and completion criteria.

## Phase 10 — Verification and rollout gate

Run adapter-specific tests against the real database, not only mocked queries. Use the repository's branching suites as a scenario catalog; integration tests here use the shared Payload fixture. Do not assume an external adapter is included in the existing CI matrix.

Required scenarios:

- Existing-data migration; branching disabled; excluded/auth/internal entities; main and two independent branches.
- Inherited/current main changes; first copy; branch creation; later edits; deletes; Trash; globals; localization; nested arrays/blocks; upload references.
- List/count agreement, page boundaries, sorting, distinct values, relationship predicates and population, polymorphic joins and counts.
- Logical-ID filters and results under narrow selections; raw bypass retains physical identities.
- Draft/latest isolation, fork-boundary history, version counts/restores, retention and exact-version recovery.
- Concurrent first writes and global upserts, atomic branch guards, rollback, unknown commit results, and supported/nontransactional environments.
- Merge/discard subset selection, dependencies, source cleanup, file retention, and retry without duplicate target writes.
- Access-controlled Local/REST/GraphQL calls through core, including nested request inheritance; adapter logic must not leak branch content around those controls.
- Large-branch query traces and performance. For retirement readiness, assert no whole-manifest read or filter arrays growing with total branch changes on normal read paths.

Publish the supported Payload revision, migrations, backend limitations, transaction guarantees, query/index assumptions, and test evidence. Roll out branching only after read and write support are verified together.

## Completion checklist

- [ ] Adapter method/support matrix complete.
- [ ] Schema and existing-data migration verified.
- [ ] Current branch reads, identities, writes, globals, drafts/versions, merge/discard, files, and transaction behavior verified.
- [ ] Backend limitations and unsupported cases documented.
- [ ] Future native-read integration agreed with core before fallback retirement.
- [ ] Large-branch and correctness gates pass on the actual backend.
