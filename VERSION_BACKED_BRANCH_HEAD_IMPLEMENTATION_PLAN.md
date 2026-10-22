Written with AI

# Version backed content branches implementation plan

Implement named content branches by extending Payload's versions and drafts engine. Versions store content; branch heads select versions; the ordinary collection and global tables remain the materialized representation used by existing live reads. Publishing is promotion into the published branch, initially `main`. A working branch does not contain a second independently publishable draft state.

This is an implementation specification with ordered delivery milestones. Complete the correctness and index/query-plan gates before enabling the new engine. Migration covers existing versions and `versions.drafts` data, including pending publish jobs. Migration from PR #17878 is explicitly excluded because that implementation was never released.

## Scope and compatibility

Support collections, globals, named branches, branch to branch merges, publication and withdrawal of individual or multiple locales, all locale operations, scheduled merges, scheduled publication and withdrawal, autosave, history, restore, preview, relationships, joins, uploads, Trash, access control, and supported database adapters.

Preserve history only configurations and configurations with versions disabled. Keep existing Local, REST, GraphQL, and SDK drafts operations working through a compatibility layer. Do not require application developers to rewrite ordinary published queries to adopt the new storage engine.

The public frontend still needs appropriate read access control. Ordinary existing reads can return an unpublished document when its collection access policy permits that, as they can today. Keeping an inactive identity row is not permission to expose its draft content publicly.

Use `main` as the canonical published branch and `drafts` as the managed default working branch. The Admin displays Published and Drafts. User created names such as staging or legal-review describe editorial stages; the names themselves grant no permissions or public visibility. Reserve the managed slugs and prevent their rename, archival, and deletion. Defer configurable published branch names until there is a concrete use case.

Branch lifecycle is active or archived. A long lived branch is not globally "merged" merely because some documents or locales were promoted. Archive only after resolving pending work and schedules; discard is an explicit operation. Keep merge history after archival.

## Behavioral invariants

1. Saving or autosaving a working branch never changes the published materialization.
2. A successful merge into main publishes the selected scopes; it never creates another unpublished draft on main.
3. A merge into a working branch advances that branch without changing live content.
4. A locale only operation preserves unselected locales and shared content unless shared content is explicitly selected.
5. Unpublish changes live availability without copying newer working content into live storage.
6. Every branch uses the same logical document identity. No physical copy ID is exposed as a different content document.
7. Explicit withdrawal suppresses inheritance. Absence of an override and withdrawal are distinct states.
8. Pinned versions are immutable. Autosave cannot change reviewed, staged, published, or scheduled content through a shared reference.
9. All queries evaluate the effective selected content before access predicates, filtering, sorting, counting, distinct values, and pagination.
10. Concurrency uses generation comparisons and adapter atomic operations, not timestamp ordering.
11. Dry run is informative; execution rechecks permissions, validation, and expected destination generations.
12. Migration never publishes content, fires application change hooks, rewrites logical IDs, or silently deletes history.

## Existing implementation touchpoints

The initial source baseline is main at `de2416c454`, package version `4.0.0-beta.3`. Build migration fixtures from the released versions actually supported by the eventual release as well as this development baseline. Do not assume scalar status and localized status databases have identical history metadata.

| Concern                            | Existing source                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Version schemas and latest markers | `packages/payload/src/versions/buildCollectionFields.ts`, `buildGlobalFields.ts`, `types.ts`                                         |
| Save and autosave coalescing       | `packages/payload/src/versions/saveVersion.ts`, `updateLatestVersion.ts`                                                             |
| Draft resolution                   | `packages/payload/src/versions/getLatestCollectionVersion.ts`, `getLatestGlobalVersion.ts`, `drafts/replaceWithDraftIfAvailable.ts`  |
| Collection writes                  | `packages/payload/src/collections/operations/create.ts`, `operations/utilities/update.ts`, `restoreVersion.ts`                       |
| Global writes                      | `packages/payload/src/globals/operations/update.ts`, `restoreVersion.ts`                                                             |
| Locale publication                 | `packages/payload/src/versions/buildSingleLocalePublishData.ts`, `allLocalesPublicationStatus.ts`, `utilities/mergeLocalizedData.ts` |
| Database draft reads               | `packages/db-mongodb/src/queryDrafts.ts`, `packages/drizzle/src/queryDrafts.ts`                                                      |
| Existing schedules                 | `packages/payload/src/versions/schedule/`, `packages/ui/src/utilities/schedulePublishHandler.ts`                                     |
| Retention and files                | `packages/payload/src/versions/enforceMaxVersions.ts`, `packages/payload/src/uploads/fileVersioning/`                                |
| Existing regression suites         | `test/versions`, `test/localization`, `test/file-versioning`, `test/plugin-cloud-storage`, `test/queues`, `test/a11y`                |

Reuse selected dependency, upload, Admin review, and permission ideas from #17878 after reviewing them against this specification. Do not merge its shadow row architecture, main only merge assumption, independent per branch draft state, or first write transaction restriction into this engine.

## Storage model

### Document identity and materialization

Retain the ordinary document row as the identity anchor so existing foreign keys, relationship IDs, custom IDs, and version `parent` references remain valid. A document created in a working branch gets an inactive anchor, not a second physical content identity. Record its owning branch and visibility separately from user content fields.

Preserve current default draft creation visibility for the managed drafts branch through the legacy API. Hide a document created only in staging or another named branch from unrelated branches. A published identity is visible in branches through inheritance unless explicitly hidden there. Deleting an unpublished branch owned identity requires proof that no head, history requirement, schedule, relationship, or file reference still needs it.

The ordinary row remains the published materialization when a document is live. For wholly unpublished documents, keep the inactive row required by legacy APIs. Its `_status` remains draft. Do not treat the continued existence of the row as publication.

Globals use their existing singleton identity and the same version/head semantics. Do not manufacture collection document IDs for globals.

### Version payloads and mutability

Continue storing full locale keyed content in each entity's existing version storage. Keep collection `parent` pointing to the logical document ID. Add internal metadata for revision generation, origin branch, creation reason, immutability, and schema generation as needed. Version generation increments whenever an exclusively owned autosave payload is replaced.

Manual saves, restores, promotions, migration baselines, and pinned snapshots create immutable versions. An autosave may replace its latest version only while that version is exclusively owned by the same branch head, has never been pinned, and its expected generation matches. Pinning permanently freezes that version. Further autosaves use copy on write.

Do not use a reference count as the only concurrency safeguard. Persist a freeze flag with an atomic compare and set, and retain durable references for garbage collection. A pin must freeze the version before a head or schedule can reference it. Re-read if the autosave generation changed while freezing.

`latest` becomes legacy compatibility metadata rather than the global source of truth. Named branch saves must not change the default drafts branch's legacy latest marker. History and current state are separate queries.

### Branch heads and content scopes

Store typed branch heads in per collection and per global adapter storage so parent and version foreign keys retain the real ID types. A head is identified by branch ID, entity identity, and scope key. Its fields include:

| Field                             | Purpose                                              |
| --------------------------------- | ---------------------------------------------------- |
| branch ID                         | Stable internal identity independent of display name |
| scope key                         | Shared content or one configured locale              |
| state                             | Version reference or explicit withdrawal/hide marker |
| version ID and version generation | Exact selected content when state is a version       |
| head generation                   | Compare and set token for the branch head            |
| base reference                    | Original main head state used for conflict detection |
| upstream receipt                  | Last destination/source pair reconciled by a merge   |
| structural dependency             | Shared structure required by localized descendants   |

Use a discriminated union: version state requires a revision reference; withdrawal has no revision reference. Missing head means inheritance, never withdrawal. The resolver returns provenance and expected generation with each effective scope, including whether it was inherited.

Discard must not permit absent/create ABA. Carry a durable per-entity, branch, and scope incarnation alongside the head generation, defaulting legacy observations to zero. Atomically removing an override advances the incarnation, which remains readable while the override is absent and is copied into any recreated head. Tokens, bases, receipts, and read comparisons include it. M2 must persist this guard and atomically check/advance it with discard; physical deletion followed by generation-one recreation alone is forbidden. Discard invalidates receipts from the previous lifetime. The adapter foundation retains an explicit absent tombstone in the same unique scoped row; its incarnation survives discard and recreation atomically updates that row. Never physically delete a guard while observations, receipts, or delayed work can refer to its lifetime.

Main has explicit publication records. It never inherits from a working branch. A withdrawn main locale has no live head and must not fall back to draft history. Keep the last published revision separately for audit and revert operations.

### Branch catalog and operation records

Create an internal branch catalog with stable ID, slug, label, lifecycle, actor, and timestamps. Keep content heads in typed adapter tables rather than a single polymorphic content store. Create internal operation records and per item outcomes for merge, discard, and withdrawal; store scheduled snapshot references separately from the queue task envelope.

Operation records contain exact selections, source tokens, expected destination tokens, permission actor, request identity, idempotency key, result state, and cleanup state. Result states distinguish completed, no-op, conflicted, refused, partially applied, failed, and committed with cleanup pending. Do not equate HTTP success or `canMerge` with applied publication.

### Indexes and constraints

Require a unique index on branch, entity identity, and scope. Index version references and operation references for retention. Index branch and pending scope state for change review. Use adapter appropriate composite indexes for optimistic concurrency and scheduled operation lookup.

Keep ordinary published unique indexes intact. Working branch uniqueness must be checked against effective branch content, including inherited values and locale/shared structure. Define uniqueness reservations or equivalent serialized conflict checks per adapter; a preflight find alone cannot enforce uniqueness under concurrent writes. Permit the same unique value on unrelated branches; reject collisions on promotion. Carry existing null, sparse, compound, and localized unique semantics into this constraint design.

## Content scope compilation and resolution

Compile field definitions into a scope plan. Shared scalar fields belong to shared scope. A localized field stores its complete value in the selected locale scope. A localized ancestor makes descendants part of that locale value.

For shared arrays and blocks with localized children, the shared scope owns row identity, ordering, block type, and nonlocalized content. Locale scopes own localized descendants attached to those row identities. A locale reference records the shared structure it depends on. Resolve values through this compiled plan; do not spread entire JSON documents or infer locale keys from arbitrary JSON/rich text values.

First implementation rule: block a locale only promotion if incompatible shared structure changed. The editor can include shared structure explicitly and review its effects on all live locales. This preserves data while avoiding speculative automatic row reconciliation. Validate every affected published locale when shared structure is included. Locale only additions on first publication require selecting the necessary shared scope.

Ordinary working branches inherit unowned scopes from main at read time. First modification captures the exact effective base. Untouched scopes continue inheriting future main changes. This is a live workspace model, not a whole site snapshot. Scheduled snapshots capture the full selected dependency closure so inheritance cannot move scheduled content.

Implement resolution as a pure core operation over validated head states before introducing database IO. Missing, inherited, withdrawn, and version owned states must be distinguishable in its result. Compare shared plus locale dependencies when deriving whether selected content differs from live.

New API `_status` is a compatibility projection: the selected scope is published only when it represents the current live selection, including shared dependencies. Otherwise it is draft. It is never an arbitrary branch name or a writable independent state inside a named branch. Preserve legacy response shapes and historical stored `_status` through the legacy serializer where their existing contract differs. Keep this distinction in one normalization/serialization boundary and test it explicitly.

## Query engine and adapter contract

Add internal adapter contracts for reading scoped heads in batches, atomic head changes, version freeze/copy, effective content queries, typed identity allocation, and capability reporting. All methods accept object parameters and the caller request/transaction. Keep core implementation helpers out of public root/shared exports unless another package requires a documented adapter import.

Published queries retain ordinary table reads. Working queries compose owned scopes with inherited main scopes in the database before applying content filters or document access queries. Never fetch a page of main results and replace items afterward; that breaks counts, ordering, access, and pagination.

For Drizzle, prototype effective row relations using typed head joins and schema generated scope selection. Include localized tables, arrays, blocks, relationships, polymorphic joins, distinct values, null operators, and stable pagination tie breakers. For MongoDB, prototype identity/main candidates, head/version lookups, scope composition, then match/sort/count/pagination and population. Avoid unbounded core reads of all overridden IDs.

Joins and relationship traversal must use the same effective relation, selected branch, locale, access context, and transaction snapshot. Cache keys include branch identity, locale/fallback, generation, and authorization context. Batched population cannot mix branches merely because logical IDs match.

Derived query projections are permitted only as rebuildable caches; heads and versions remain authoritative. Their updates must be transactionally consistent or guarded by generation so stale cache data never determines permission or publication. Verify that effective queries retain suitable native indexes and plans before building the full Admin; defer broader timing optimization while functionality is implemented. Do not claim the existing `queryDrafts` implementation already solves sparse locale overlays.

Required adapters: MongoDB, Postgres, SQLite, Vercel Postgres, and D1 SQLite. Verify wrapper capabilities and runtime limits separately. Third party adapters get an explicit capability contract and a clear unsupported error for named branches; never silently select main. Preserve their legacy drafts path during the compatibility period if the old adapter contract is available.

## Writes and autosave

Normalize every request into an internal intent: save working content, write live content, promote, withdraw, restore, hide/delete, or discard. Resolve explicit branch before inherited request context. Without branch context, retain legacy API behavior; do not consult an Admin preference for ordinary API calls. Explicit destination operations construct a destination request without mutating the caller's source request.

For a working save:

1. Authenticate and authorize branch, entity, field, and locale access.
2. Resolve effective content, expected heads, and structural dependencies.
3. Run normal field and entity hooks once with defined original document and operation semantics.
4. Apply draft validation policy; permit incomplete content where drafts permit it today.
5. Create a version or update an exclusive autosave using a generation comparison.
6. Change selected heads and uniqueness reservations in the same transaction.
7. Record visibility for branch created identities and defer file cleanup until commit.
8. Return logical content through the existing read transform and status projection.

Treat no-op saves consistently with existing timestamps and hooks. A stale autosave must return a conflict rather than discard the caller's edits by returning another request's later version. Manual save, preview checkpoint, staging promotion, scheduling, and publication all freeze the selected version.

Nested operations reuse `req` and its transaction. First writes on inherited content must work inside caller transactions. Do not commit independently or replay arbitrary application hooks automatically. If retry is needed inside an outer transaction, return the retryable conflict to its owner.

## Promotion and conflict handling

Expose one merge engine with explicit source and destination. Main is the publication destination. Publish buttons and legacy publish requests normalize into that engine or the equivalent single item live write intent; they do not maintain a separate publication implementation.

Use explicit selections of entity IDs, locale scopes, and shared scope. Omitted selection means all eligible pending changes; an empty selection means no changes. A stale explicit selection is a conflict with item details, not implicit permission to publish different or additional work. Store document IDs and scopes in public requests; keep internal change-record IDs private.

Execution sequence:

1. Normalize selection and reject incompatible flags and unknown branches/locales.
2. Resolve, freeze, and pin source revisions, including structural and relationship dependency requirements.
3. Resolve expected destination state and build a complete candidate set.
4. Authorize source reads, destination writes, status transitions, fields, and locales against candidate content.
5. Validate candidate content, uniqueness, relationship existence, and required publish dependencies. Allow references between documents in the same batch, including cycles, using a candidate overlay and two phase identity/content preparation.
6. Refuse selected overlapping destination changes unless overwrite was explicitly authorized. Compare generation/state tokens, including absent and withdrawn states; timestamps are audit data only.
7. Apply normal destination hooks, writes, versions, and head changes under the adapter's transaction capability. Recheck generation comparisons inside the write boundary.
8. Materialize published content when destination is main. Shared changes validate and update the affected locale dependency set together.
9. Commit the operation outcome with destination changes, then deliver commit aware effects and cleanup.
10. Reconcile source pending state only if its selected token still matches. Preserve edits made after the captured source and keep unselected locale work pending.

After merge, reusable branches remain active. Resetting a source scope to inheritance is safe only when inheritance now resolves to the applied content. Merging drafts to staging must not reset drafts to main and lose the staged candidate. Retain the source head and a merge receipt in that case. Main to working branch promotion is explicit; main to main and source equal destination are rejected.

Conflict detection is scoped replacement with base comparisons. No general field by field three way merge is required. Disjoint locale edits can proceed only if shared structure and dependencies are compatible. Overwrite requires separate authorization and an audit record.

## Publication and withdrawal

Publish selected locale data into the ordinary row using current localized write/transform machinery. Preserve unselected locale values and statuses byte for byte where possible. Never copy another locale from a full version payload just because the selected revision contains it.

All locales expands to a concrete configured locale set at request or snapshot time. Fail if the actor cannot act on every requested locale; do not silently shrink the request. Expose the expanded set in review and results. Latest-at-execution schedules may explicitly expand at execution, and must state that policy.

Withdrawal updates availability and projected status while retaining last published content and references. A locale withdrawal must not replace shared content, newer working data, or other published locales. Withdrawal of the last locale leaves the identity and required history intact. Public fallback may resolve only to permitted published locales, never to working versions; preserve configured fallback semantics and test them.

Scope publication separately from Trash and permanent deletion. Working branch deletion is a hide/tombstone until merged. Merging deletion into main applies the configured Trash/delete operation with dependency checks. Discard removes selected overrides and restores inheritance; it does not withdraw main. Permanent deletion cleans up all branch references and schedules only through an explicit authorized operation with a retention policy.

## Legacy API compatibility

Keep `_status` binary and preserve localized map shapes with `locale: 'all'`. Do not introduce `staging` values into generated document status unions.

| Existing request                                         | Normalized behavior                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `draft: true` read without explicit branch               | Default drafts effective view, including current fallback semantics                         |
| Ordinary read without branch                             | Existing ordinary materialization and access semantics                                      |
| Working update with `draft: true`                        | Save selected scopes in drafts with existing validation rules                               |
| Explicit publication via `_status: 'published'`          | Publish submitted/effective candidate selected by the old operation contract                |
| `_status: 'draft'` through the existing live update path | Preserve existing update plus withdrawal semantics without mixing unrelated working content |
| `publishAllLocales` or `unpublishAllLocales`             | Normalize to explicit locale scopes; preserve field access checks                           |
| Restore with draft mode                                  | New revision in the default working branch                                                  |
| Restore live published/mixed status version              | Explicit publication/withdrawal plan with authorization for every transition                |

Characterize create separately from update. Existing draft creation allocates an ordinary row, and explicit status and flags have operation specific precedence. Test omitted fields, omitted status, `draft: false`, publish overrides, invalid flag pairs, localized status, globals, and bulk writes before routing them through new intents.

New requests use `branch` and explicit promotion/withdrawal. Reject ambiguous mixtures of new branch selection and legacy draft/status control with actionable validation errors. Preserve legacy calls that merely inherit request context through an explicit internal compatibility mode, rather than treating inherited branch as an explicit conflicting argument.

Implement Local API first, then REST, GraphQL, SDK, CLI, generated types, and OpenAPI/schema documentation. Build query strings with `qs-esm` and routes with `formatAdminURL`. Do not expose trusted raw cross branch bypass through public query parameters.

## Configuration and public operations

Keep `versions.drafts` and its autosave, validate, and schedulePublish options. Add a proposed `versions.branches: true` option on collections/globals to enable additional named working branches. Require drafts for this option and report configuration conflicts. Drafts alone uses the same head engine with managed main/drafts branches; named branching does not add another storage mode.

Use one optional root branch policy configuration for branch catalog access, merge hooks, and defaults. It configures policy, not a separate second feature enablement switch. Auth collections remain ineligible for named branching; audit system collections and plugin interactions explicitly.

Expose catalog CRUD through the normal internal collection API, with server side lifecycle constraints. Limit the operation facade to merge, discard, withdraw, and schedule; schedule cancellation uses a guarded cancellation operation that also releases pins. Use explicit object parameters, typed entity selectors, locale selections, expected tokens, and idempotency keys. Final names become public only after Local/REST/GraphQL parity tests and generated type review.

Require an explicit destination for new merges. Request context inheritance applies to ordinary operations, not to resolving an omitted merge destination. Add access hooks for branch management and source/destination actions while preserving ordinary collection/global/field access as an additional check.

## Scheduling

Use the existing jobs queue with versioned operation envelopes. The queue references a durable scheduled operation containing actor identity, source/destination IDs, selected scopes, source policy, destination expectations, UTC execution time, timezone display metadata, and idempotency key.

New schedules default to snapshot mode. Freeze and pin exact selected revisions plus their structural/dependency closure at scheduling time. No whole branch write freeze is necessary. Later edits do not alter the scheduled content. An explicit latest-at-execution mode resolves only the declared selection policy at execution and captures that resolved plan before writes.

At execution, restore the scheduling actor using auth collection plus real typed ID. Fail closed for deleted users, revoked permissions, unavailable branches/locales, missing pins, or invalid content. A queue runner's identity must not replace the scheduler. Trusted actorless jobs require an explicit service policy and are never inferred from a missing user.

Default destination conflict policy is refuse, with an optional explicit authorized overwrite policy recorded when scheduling. Publishing a snapshot may conflict with a later live edit; report the conflict rather than silently overwriting it.

Withdrawal schedules support an expected publication receipt so an old expiry cannot withdraw a newer release. A clearly selected "withdraw current publication" policy can apply regardless of receipt. Define deterministic ordering or refuse conflicts for multiple operations on the same destination scope at the same instant. Cover cancellation, rescheduling, retries, leases, worker death, missing selections, empty selections, clock changes, and timezone/DST display.

Commit destination state and operation receipt together when transactions support it. A retry checks the receipt before reapplying or repeating effects. Keep pins until successful completion, confirmed cancellation, or explicit failed-operation retention expiry; do not release a snapshot merely because the queue attempt failed.

## Transactions and external effects

Require adapter capabilities for atomic single head updates, multi scope transactions, and multi entity release transactions. MongoDB replica set and transaction enabled SQL behavior get explicit tests. Verify D1 and other runtime constraints before advertising atomic release support.

Without a multi entity transaction, permit resumable per item application with an honest partial outcome and item receipts; do not claim atomic site wide visibility. Complete dependency checks before starting. If the selected release requires atomic visibility, reject it on an incapable adapter rather than pretending compensating writes are atomic rollback.

Normal write hooks must run with destination context and documented originalDoc/previousDoc values. Define beforeOperation, beforeValidate, beforeChange, afterChange, restore, and merge hook ordering once. Preflight cannot execute arbitrary mutating change hooks as a fake write. Recheck hook modified data under normal validation and access rules before materialization.

Application afterChange hooks may perform irreversible effects before transaction completion. Preserve their existing contract and document it; do not promise exactly once external effects. Provide a durable after-commit event/outbox path for built in revalidation, search, and new merge completion hooks, with stable event IDs and idempotent consumers. Never automatically replay arbitrary user hooks after ambiguous commit outcomes.

## Uploads and retention

Reuse file versioning manifests and storage integration. Every head, immutable base, schedule, retained history item, operation recovery record, and live materialization is a retention root. Branch version selection must not duplicate or delete files solely because the same logical document moved stages.

Change `enforceMaxVersions` to prune only unreferenced history. `maxPerDoc`/global max limits eligible history, not indispensable current state. Retained roots can exceed the configured history count; document and expose that count. Enforce limits per logical document with branch aware history selection, not independently destructive pruning per branch.

Implement mark-and-sweep or equivalent reference validation with a grace period and final reference check before version/file deletion. Coordinate GC with in-flight pinning and transactions. Cancelled operations release their references after workers acknowledge cancellation. Avoid deleting a referenced version through direct version cleanup paths, parent cascade, or disabled-feature cleanup.

Verify local and cloud files, derivatives, replaced draft uploads, branch-only media, rollback, failed cleanup, Trash, and restoration. Add a repair command that reconstructs derived materializations/projections from heads and versions and reports missing payloads without publishing replacements automatically.

## Migration from existing versions and drafts

### Supported source states

Inventory actual source schema generations at migration start. Include scalar and localized `_status`, publishedLocale and snapshot history where present, mutable latest autosaves, missing or duplicate latest markers, pruned history, documents without versions, globals without materialized rows, custom IDs, trashed data, and pending schedules. Existing content branching rows are outside scope.

History only collections retain their data and old behavior. Versions disabled collections receive no branch tables or content backfill unless drafts/named branches are explicitly enabled through supported configuration.

### Deployment protocol

Use an explicit offline cutover as the supported initial migration. Pause writes, autosave, scheduled workers, and direct adapter writers; take a consistent backup; run schema expansion and resumable backfill; verify; switch the engine marker; restart all application and queue processes on the compatible release. Do not claim a rolling mixed old/new writer deployment is safe.

Persist migration schema version, configuration fingerprint, entity checkpoints, and completion state. New runtime writes fail clearly if required backfill is incomplete. Migrations use internal adapter writes and bypass application hooks, external effects, and jobs execution. Re-running a completed entity validates its fingerprint and skips already committed work.

### Backfill algorithm

1. Expand storage with branch catalog, typed head tables, version metadata, operation/pin records, indexes, and a per entity engine marker. Create managed branches with deterministic identities.
2. Scan ordinary rows by stable primary key in bounded batches; read full stored localized values without fallback, population, defaults, or read hooks. Preserve dates, IDs, deletedAt, nulls, and absent fields.
3. Capture the materialized row as the live baseline. Reuse an existing immutable version only when full stored content matches, including shared/localized data and relevant metadata. Otherwise create an internal immutable baseline version. Do not find the last historical `_status: 'published'` and assume it is live.
4. Seed main's shared content and per locale publication/withdrawal state from the actual materialized status and supported source schema. Keep unpublished identity payload for legacy reads without creating live membership. For scalar publication state, use the documented source generation's locale semantics rather than treating a missing translation as evidence of a distinct status.
5. Resolve the current working view using the existing source generation's actual draft selection semantics. Include latest/snapshot/autosave rules and per locale status. Compare effective scopes to main, then create drafts overrides only where required to preserve the working view. Seed structural dependencies and freeze any reused version. Do not label every historical draft as pending work.
6. Preserve original historical rows, IDs, and content. Attach origin metadata without rewriting their historical status. Preserve REST/GraphQL version lookup and restoration by existing version ID. Internal baseline rows are excluded from user history counts/diffs by default.
7. Migrate globals with the same materialized-versus-working comparison, including absent globals. Do not create publicly visible default content just to supply a head.
8. Record orphan history and inconsistent latest markers in the report. Do not resurrect deleted identities. For ambiguous working content, refuse cutover for that entity until an explicit repair policy is selected. Timestamp ties are not permission to invent a newer draft.
9. Preserve queued schedulePublish jobs and original waitUntil/timezone values. Keep a versioned legacy decoder: old jobs retain latest-at-execution policy rather than being silently frozen at migration. Capture a source snapshot once their execution starts. Convert resolvable scheduling users to typed actor identities; flag missing/ambiguous users for rescheduling, never execution as administrator.
10. Validate and checkpoint each entity. Only after all required checks pass, activate the new engine marker and allow application writes. Rebuild derived indexes/projections before activation.

Do not depend on history surviving to reconstruct current live or working content. Main may lack an exact historical match, and retention may have removed earlier publication snapshots. The migration report distinguishes necessary synthetic baselines from preserved user history.

### Migration verification

Before and after migration, compare canonical depth-zero content with fallback disabled for ordinary and draft reads, every configured locale and locale all, collections and globals. Include list results, IDs, sorting, counts, status maps, relationships, history IDs, pending schedules, upload references, custom IDs, Trash, and public access policies.

Canonical comparison excludes only newly internal metadata. It does not ignore timestamps, missing-versus-null fields, locale status, row IDs, or ordering. Run a second migration pass and an interrupted/resumed pass and prove identical results. Migration must emit zero publish/change hook side effects and execute zero queued jobs.

### Rollback and recovery

Before activation, rollback removes only added structures/internal baselines identified by the migration ledger or restores backup. Preserve old rows and version IDs. After new branch work exists, a down migration cannot flatten multiple branches into one draft without loss. Require export/preservation of named work and an explicit chosen default working state, or restore the pre-cutover backup with a stated loss of subsequent writes. Never provide a destructive automatic down migration disguised as lossless rollback.

## Admin and accessibility

Extend current save, autosave, publish, unpublish, version diff/restore, and schedule components. Drafts only projects keep their familiar workflow. Named branch projects add a branch selector, change review, source/destination comparison, and promotion review with explicit locale and shared scope selection.

Display live state and branch location separately: English published; French in staging; newer Drafts available. Avoid one global status badge that hides mixed locale state. Explain when shared structure forces broader publication review. Show snapshot versus latest schedule policy, affected dependencies, destination conflicts, partial outcomes, and cleanup warnings.

Use existing component folder conventions, plain CSS tokens, getTranslation for config labels, stable hook arguments, and the generate-translations skill when new translation keys are introduced. Server components reference client exports through proper boundaries and receive production bundle verification.

Assess branch selector, locale selection, diff, review dialog, error recovery, schedule drawer, and async progress for keyboard, pointer, narrow viewport, zoom, and assistive technology states. Potentially affected WCAG 2.2 A criteria include 1.3.1, 1.4.1, 2.1.1, 2.1.2, 2.4.3, 2.5.3, 3.2.2, 3.3.1, 3.3.2, and 4.1.2. AA criteria include 1.4.3, 1.4.10, 1.4.11, 2.4.6, 2.4.7, 2.4.11, 2.5.8, 3.3.3, 3.3.4 where applicable, and 4.1.3. Review other criteria when actual rendered controls introduce them.

Put criterion evidence in `test/a11y/WCAG.e2e.spec.ts`; use the existing axe helper for distinct rendered states. Use `test/a11y/screen-reader.spec.ts` for speech/cursor evidence, with manual VoiceOver/NVDA and visual focus/reflow confirmation where automation cannot establish the outcome. No UI conformance claim follows from backend unit tests.

## Delivery milestones

| Milestone                   | Implementation                                                                                                         | Required evidence before proceeding                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| M0 Contract baseline        | Characterize existing create/update/read/restore/status/locale/autosave/schedule semantics and add upgrade fixtures    | Existing behavior recorded in executable tests; intentional changes named                              |
| M1 Head domain              | Internal typed head states, immutable tokens, resolution, selection, base conflict rules, and pure transition planning | Focused tests for inheritance, withdrawal, locale isolation, stale tokens, and no mutation             |
| M2 Adapter foundation       | Typed schema, head CAS, freeze/pin, identity visibility, and transaction capabilities in MongoDB and Drizzle           | Same adapter contract passes MongoDB/Postgres/SQLite; wrappers exercised separately                    |
| M3 Effective queries        | Native effective content relations, access predicates, joins, count/sort/pagination/distinct and scope compilation     | Full query parity plus native index/query-plan review; no core unbounded shadow ID lists               |
| M4 Working writes           | Legacy normalization, create/update/autosave/restore, nested transaction composition, status projection                | Existing versions suites pass through head engine; draft writes leave main unchanged                   |
| M5 Promotion and withdrawal | Arbitrary destination merge, scoped conflict checks, candidate validation, live materialization, source reconciliation | Drafts to staging to main plus locale subset and mixed shared structure integration tests              |
| M6 Lifecycle and assets     | Branch catalog permissions, visibility, discard, Trash/delete, retention roots, uploads, repair                        | Cross branch isolation and no retained file/version loss under GC races                                |
| M7 Scheduling and recovery  | Snapshots/latest policy, typed actor, durable receipts, cancellation, conflicts, retries, effect delivery              | Worker crash/retry and revoked actor tests; no unintended new publication                              |
| M8 Public API parity        | REST/GraphQL/SDK/CLI, types, validation errors, schema support boundaries                                              | Equivalent operation outcomes and negative access tests across interfaces                              |
| M9 Migration                | Adapter migrations, source fixtures, resumability, verification report, cutover/rollback tooling                       | Supported released data upgrades without read/content/schedule loss                                    |
| M10 Admin                   | Existing drafts flows plus named branch review, locale actions, scheduling and results                                 | Browser flow tests, accessibility evidence, translations, production bundling, Docker visual baselines |
| M11 Release                 | Full adapter/plugin matrix, index checks, documentation, examples, upgrade rehearsal                                   | All release gates below met; operational limits documented                                             |

M0 and M1 start implementation. M2 and M3 establish whether the chosen representation can serve real queries. Do not build an Admin over a head engine with unproven database semantics. Develop migration fixtures early in M0 and migration logic alongside M2/M4; M9 is the complete cutover rehearsal, not the first migration work.

Deliver small reviewable changes in this order. Core package fixes use `fix:` without a payload scope; UI fixes use `fix(ui):`. Feature work uses appropriate Conventional Commit titles. External PR descriptions and comments begin with Written with AI. Do not commit unrelated local review notes.

## Test and release gates

Pure tests cover scope resolution, state tokens, inheritance, withdrawal, selection normalization, stale bases, structural incompatibility, and transition planning. Integration tests use `test/__helpers/int/vitest.ts` and one root fixture suite; fixtures own database setup/reset. Clean up files, queue side effects, environment changes, and external resources explicitly.

Add a dedicated head-engine integration suite plus regressions in existing versions, localization, file-versioning, cloud-storage, queues, GraphQL, REST, and generated type suites. Tests should assert observable content and storage safety, not mirror helper implementation.

Required concurrency/failure cases: first inherited write in caller transaction; two autosaves; autosave racing pin; source edited during merge; destination edited after preflight; shared structure changed under a locale; overlapping schedules; cancellation racing execution; commit acknowledgement lost; cleanup failed after commit; GC racing a new pin; duplicate worker execution; failed uniqueness reservation; and hooks altering candidate data.

Per the user’s 2026-10-22 direction, prioritize functionality and narrow performance review to proper indexes and native query plans. Verify identity/head/projection access paths, locale and relationship predicates, branch restrictions, and preservation of the ordinary published indexed path. Retain existing large-fixture plans and correctness evidence. The former 2x timing ceiling and complete 48-case benchmark matrix are superseded as milestone/release blockers; further timing, profiling, memory and load tuning are deferred until functionality is implemented. Historical timing failures remain failures and are not converted into passes by this scope change.

Representative validation commands, narrowed by changed suites as work lands:

```sh
pnpm exec vitest --project unit packages/payload/src/versions/branches
pnpm test:int versions
pnpm test:int localization
pnpm test:int:postgres version-branches
pnpm test:int:sqlite version-branches
pnpm test:int version-branches
pnpm test:types
pnpm test:e2e a11y --grep WCAG --workers=1
pnpm lint
pnpm lint:css
pnpm format:check
```

Create the planned `test/version-branches` suite before using its commands. Run server/client boundary changes with `pnpm prepare-run-test-against-prod` followed by `pnpm dev:prod <suite>`. Generate/update visual baselines only with `pnpm test:visual:update` in the pinned Docker workflow. Run screen-reader verification on a configured supported machine.

Release requires data migration comparison and interrupted retry tests; a working drafts/staging/main flow; per locale and all locale publish/withdraw/schedules; API access parity; upload retention; honest adapter transaction capabilities; native index/query-plan evidence; existing drafts regressions passing; and documented upgrade/rollback instructions. Every remaining limitation has an explicit behavior and test rather than an unspecified fallback.

## Implementation progress

- [x] Record full implementation scope and existing drafts migration requirements.
- [x] Create local implementation branch `feat/version-backed-branch-heads`.
- [x] M0 Characterize the legacy contracts and create migration fixtures.
- [x] M1 Implement and test the internal head domain and resolution rules.
- [x] M2 Adapter foundation and native concurrency contracts.
- [x] M3 Effective queries and native index/query-plan review.
- [ ] M4 Working writes and legacy operation integration.
- [ ] M5 Promotion and withdrawal.
- [ ] M6 Lifecycle, retention and assets.
- [ ] M7 Scheduling and recovery.
- [ ] M8 Public API parity.
- [ ] M9 Existing-drafts migration and cutover.
- [ ] M10 Admin workflows and accessibility.
- [ ] M11 Release verification and documentation.

M1 implementation in `packages/payload/src/versions/branches` now covers internal scope/head/version types, entity-qualified generation/incarnation tokens, inheritance and withdrawal resolution, batch selection, merge bases and destination receipts, shared/locale dependency closure, and source reconciliation. Independent final review passed with no remaining blocking findings. Promotion into an inheriting destination establishes an owned head even when content already matches, preserving reviewed staging content against later main changes. The original single-scope helper remains a preliminary comparison utility; executors must use the guarded batch transition contract.

Initial verification on Node 24.15.0: 47 focused unit tests passed; targeted oxlint, oxfmt, and strict standalone TypeScript checking passed. Two regression cases for matching inherited content failed before the ownership fix and passed afterward. These tests exercise the domain without database IO; they do not establish adapter atomicity, runtime API integration, migration correctness, or rendered accessibility.

Current work: M3 independent correctness and native index/query-plan review passed under the reduced gate below. The first M4 persistence slice is published; authoritative operation originals and selected working writes are undergoing independent review. Public reads, autosave ownership and the remaining M4 requirements follow as separately reviewed slices. The internal engine does not enable the feature. Further timing optimization is deferred in favor of functional delivery.

### Draft review stack

The stack starts at main. Each layer targets the preceding branch so reviewers see its incremental diff. This is an initial implementation stack; it does not complete M0 through M11 or enable the feature.

| Layer | Draft                                                      | Delivered scope                                                                                                       |
| ----- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1     | [#18898](https://github.com/payloadcms/payload/pull/18898) | Head domain, generation comparisons, scope merge planning, and implementation specification                           |
| 2     | [#18899](https://github.com/payloadcms/payload/pull/18899) | Existing drafts compatibility fixture and eight baseline SQLite contracts                                             |
| 3     | [#18900](https://github.com/payloadcms/payload/pull/18900) | Fix collection Local API restoration dropping its draft flag, with a failing-before/passing-after regression          |
| 4     | [#18901](https://github.com/payloadcms/payload/pull/18901) | Schema compiled scope projection/composition, typed row matching, and real stored-content integration evidence        |
| 5     | [#18902](https://github.com/payloadcms/payload/pull/18902) | Internal per-entity head schemas, native generation guards, unique first creation, and corruption checks              |
| 6     | [#18903](https://github.com/payloadcms/payload/pull/18903) | Pure existing-drafts head planning and persistence verification without changing live content/history                 |
| 7     | [#18909](https://github.com/payloadcms/payload/pull/18909) | Complete legacy contracts and genuine released-package SQLite source fixtures                                         |
| 8     | [#18910](https://github.com/payloadcms/payload/pull/18910) | Guarded batch head transitions, entity-qualified observations, receipts, dependencies, and reconciliation             |
| 9     | [#18914](https://github.com/payloadcms/payload/pull/18914) | Native version-backed branch storage, guarded caller transactions, durable pins/visibility and adapter capabilities   |
| 10    | [#18915](https://github.com/payloadcms/payload/pull/18915) | Localized hierarchy join UUID/native-ID ordering regression correction                                                |
| 11    | [#18916](https://github.com/payloadcms/payload/pull/18916) | Explicit unsupported Cosmos/Firestore transaction contracts and supported-adapter test scoping                        |
| 12    | [#18929](https://github.com/payloadcms/payload/pull/18929) | Internal effective-query schemas, composition, guards, maintenance and immutable read protocol                        |
| 13    | [#18930](https://github.com/payloadcms/payload/pull/18930) | Native SQL effective queries, typed joins and PostgreSQL/SQLite/D1 read boundaries                                    |
| 14    | [#18931](https://github.com/payloadcms/payload/pull/18931) | MongoDB effective queries, pinned sessions and ordinary relationship/geospatial propagation                           |
| 15    | [#18932](https://github.com/payloadcms/payload/pull/18932) | Effective-query native fixtures, caller snapshot admission, identity compatibility and correctness evidence           |
| 16    | [#18933](https://github.com/payloadcms/payload/pull/18933) | Source-pinned native performance harness, historical diagnostic artifacts and explicit outstanding matrix             |
| 17    | [#18936](https://github.com/payloadcms/payload/pull/18936) | Cached schema traversal with exact presence validation; independent native parity, performance remeasurement pending  |
| 18    | [#18937](https://github.com/payloadcms/payload/pull/18937) | Actual native SQLite read snapshots, coherent scoped reads and primary error preservation during cleanup              |
| 19    | [#18938](https://github.com/payloadcms/payload/pull/18938) | Custom-schema SQL rank, localized access and sort alias correction with independent native PostgreSQL/D1 evidence     |
| 20    | [#18939](https://github.com/payloadcms/payload/pull/18939) | Fractional-ID contract admission preserving native DocumentDB and ordinary Cosmos coverage                            |
| 21    | [#18940](https://github.com/payloadcms/payload/pull/18940) | Complete all-locale benchmark cache/authority equivalence, heavy samples and targeted corruption detection            |
| 22    | [#18941](https://github.com/payloadcms/payload/pull/18941) | Reproduced logout identity race fix, compatible public types and production keyboard/browser evidence                 |
| 23    | [#18943](https://github.com/payloadcms/payload/pull/18943) | Reuse compiled SQLite schema with fresh native read sessions; independent snapshot, cleanup and reconnect proofs      |
| 24    | [#18944](https://github.com/payloadcms/payload/pull/18944) | Transfer private native related graph rows while preserving root and lookup isolation; independent ownership review   |
| 25    | [#18945](https://github.com/payloadcms/payload/pull/18945) | Native indexed root paging and same-statement count, with collision-safe SQL names and independent native review      |
| 26    | [#18947](https://github.com/payloadcms/payload/pull/18947) | Indexed joined filters for root sorting, exact native distinct counts and independent SQLite/custom PostgreSQL review |
| 27    | [#18948](https://github.com/payloadcms/payload/pull/18948) | SQLite snapshot readiness batching with exact scope validation, bounded native SQL and independent protocol review    |
| 28    | [#18954](https://github.com/payloadcms/payload/pull/18954) | Backend-specific joined paging: retain ranked PostgreSQL/Vercel queries and indexed SQLite/D1 membership paging       |
| 29    | [#18955](https://github.com/payloadcms/payload/pull/18955) | Exclusively leased local SQLite read clients with native capability checks, scope expiry and generation retirement    |
| 30    | [#18958](https://github.com/payloadcms/payload/pull/18958) | Test-only private SQLite client observation, native cold/warm wiring proof and explicit attribution boundaries        |

| 31 | [#18961](https://github.com/payloadcms/payload/pull/18961) | Branch-scoped PostgreSQL private locale index and localized ranking root fence; independent native review |

| 32 | [#18962](https://github.com/payloadcms/payload/pull/18962) | Current Lexical editability and persistent per-document history with independent production keyboard evidence |

| 33 | [#18964](https://github.com/payloadcms/payload/pull/18964) | Preserve genuine Mongo numeric-zero identities through serialization, version parent creation and branch bootstrap |

| 34 | [#18965](https://github.com/payloadcms/payload/pull/18965) | Mongo-only bounded graph native-PK targeting with typed identity, collation, snapshot and zero-ID proofs |

| 35 | [#18966](https://github.com/payloadcms/payload/pull/18966) | Honor local example scaffolding and isolate unit tests from live npm metadata without changing timeouts |
| 36 | [#18969](https://github.com/payloadcms/payload/pull/18969) | Independent M3 correctness/index signoff and functionality-first sequencing; timing work deferred |
| 37 | [#18970](https://github.com/payloadcms/payload/pull/18970) | Restrict native Mongo graph/zero integration cases to supported transaction adapters |
| 38 | [#18972](https://github.com/payloadcms/payload/pull/18972) | Ignore stale Lexical link-drawer initialization; production race and keyboard/state regressions |
| 39 | [#18973](https://github.com/payloadcms/payload/pull/18973) | First M4 slice: migration-gated working-save persistence, native snapshots, guarded hooks and retention roots |

Historical implementation state as of 2026-10-21 (superseded by the revised M3 signoff below):

- M0 now has executable live/working, localized publish/withdraw, autosave, restore, validation, global, Local/REST/GraphQL/SDK read parity, access, and pending-job baselines. Genuine published-package SQLite exports cover stable 3.91.0 scalar statuses and current 4.0.0-beta.3 localized statuses. Independent phase review and full existing-suite evidence are recorded below before signoff; adapter-specific source upgrade rehearsals remain M9.
- M1 includes the scope compiler/content composition and guarded batch transition domain described below. Independent final review passed; runtime operation integration retains its M4/M5 gates.
- M2 now has opt-in schema registration, native version generation/freeze/ownership CAS, durable incarnation tombstones, guarded head batches, pin roots, identity allocation/visibility metadata, honest transaction capabilities, and a dedicated D1 guarded SQL-batch primitive. Independent review, concurrency/matrix checks and full existing versions regressions pass; no engine cutover or public branch operations are enabled.
- M9 has a per-identity planning primitive that distinguishes actual materialization from resolved working snapshots, handles scalar/localized statuses, retains unpublished working content, and preserves legacy draft metadata references. It does not execute schema migration, freeze versions, resolve historical source generations, migrate jobs, or activate the engine.
- M3 through M8 and M10 through M11 remain outstanding. Custom-schema SQL, SQLite snapshot, benchmark seed parity, adapter test-scoping and the existing logout race exposed by CI have independently approved corrections. The final performance gate remains open and the engine is inactive. Complete operation/access/hook integration, live materialization, schedules, retention/GC, public APIs, migration cutover and Admin flows remain unimplemented.

The collection Local API restore fix passes its new regression and 15 selected existing restore regressions against SQLite. The separate logout race correction in draft #18941 includes production browser and keyboard evidence, as recorded in the review ledger; it does not establish branch Admin accessibility or full conformance. Review descriptions distinguish each layer's tests from the remaining release gates.

### Independent review gates

The complete six-layer stack received an independent subagent review before further phase implementation. The reviewer found one blocking migration issue: shared row reordering incorrectly created locale overrides for unchanged translations, preventing subsequent main translations from inheriting. A separate implementation agent fixed recursive locale comparison to use typed row identities while preserving localized container order. Independent re-review passed with no remaining blocking findings. All 107 branch unit tests pass; the two migration integration tests pass on SQLite, PostgreSQL, and MongoDB.

Each subsequent milestone has a fresh implementation agent and a separate review agent. Findings are fixed and re-reviewed before advancing. A milestone remains incomplete until its stated evidence gate is satisfied; draft PR creation alone does not satisfy that gate.

### M0 contract baseline implementation

A fresh M0 implementation agent extended `test/version-branches` to 33 integration contracts. The phase characterizes existing permissive-anchor visibility, published access predicates, forbidden anonymous version/write access, working-query counts/sort/page, REST/GraphQL/SDK working reads, required-field publication validation, global restoration, latest-at-execution collection/global schedules, typed/deleted/bare scheduling actors, and legacy withdrawal behavior. `test/version-branches/CONTRACTS.md` maps these tests and existing versions/localization suites to the compatibility requirements and names intentional future changes.

The source fixtures were generated by isolated immutable npm installs of `payload` and `@payloadcms/db-sqlite` at 3.91.0 and 4.0.0-beta.3. They contain actual SQLite DDL, full raw content/version/locale/row tables, incomplete unpublished identities, globals, pending job inputs, observed live/working API views, npm integrity provenance, and SHA-256 hashes. Both exports reproduced byte-for-byte from newly generated databases. Two independent in-memory SQLite replay tests verify importability, foreign keys, history, pending schedules, and scalar versus localized status storage. These are source contract fixtures; they do not claim that schema/status/head/job migration or cutover is implemented. MongoDB/PostgreSQL released source exports and the complete supported release range remain M9 gates.

Pre-review checks: all 33 integration contracts pass on SQLite, PostgreSQL, and MongoDB. The full existing versions SQLite suite passes all 146 tests. All 109 unit tests (107 head tests and two source fixture replays), core TypeScript, targeted lint, formatting, and git diff whitespace checks pass. Independent M0 review passed after removing duplicate properties in typed-actor tests. The reviewer independently replayed both source fixtures and checked lint and whitespace. M0 is complete; native released-source upgrade rehearsals, migration execution, and browser verification retain their later milestone gates.

### M1 guarded transition domain implementation

A fresh implementation agent added pure batch selection and transition planning. Entity-qualified observations distinguish collection/global identities and numeric/string custom IDs. Omitted selection expands pending work; explicit empty selection does nothing. Explicit review includes expected source observations and which scopes were pending. A pending scope becoming applied, inherited, or missing conflicts. All-locales expands to the configured set, preserving explicitly reviewed inherited/already-applied scopes as guarded no-op observations for later authorization without creating head writes or new receipts.

First promotion compares the destination against the source's captured main base. Later promotions use destination-specific committed receipts. Authorized overwrite can replace a diverged base but cannot bypass stale review tokens or structural dependencies. Plans retain source/destination/dependency read conditions, propose exact next generations and receipt tokens, preserve a working destination's original base, and establish owned staging heads where required. Shared replacement checks every configured destination locale; a no-op shared observation cannot falsely supply source structure for a locale write. Indexing by typed entity/scope/head keys keeps inventory, selection, and read-set aggregation linear in the number of observations; a 10,000-entity test checks all writes, receipts, and 20,000 read conditions without a timing assertion.

Guarded source reconciliation preserves edits after capture and retains drafts when merging into staging. Reverting a published source to inheritance requires matching the committed publication, selected source, and shared dependencies, and returns a required durable incarnation advance. Explicit discard restores inheritance; withdrawal preserves the original main base for working heads and returns prior content for audit. No-op transitions retain read conditions. Tests cover discard/recreate ABA, absent guard changes, mismatched durable guards, and stale receipts from earlier source incarnations at equal, lower, and higher recreated generations.

These are trusted internal planning contracts. M2 must implement durable guard storage, freezing/pinning, atomic read checking and capability reporting. M4/M5 must perform authorization, hooks, validation, materialization, receipt persistence and source cleanup inside the supported commit boundary. No public operation, scheduled action, migration activation, or Admin UI is enabled by M1. Final independent review and verification results are recorded before its checkbox is completed.

Pre-review M1 verification: all 154 unit tests pass (152 branch-domain tests plus two released-source replay tests), including 45 new transition cases. All 34 current-adapter integration contracts pass on SQLite, including refusal of unsupported durable-guard writes before mutation. Core TypeScript, targeted oxlint, formatting, and whitespace checks pass. These checks establish the pure-domain and compatibility boundaries; M2 and later gates remain as stated above.

Independent M1 final review passed after fixing withdrawal base corruption, discard/recreate ABA, stale-lifetime receipts, no-op read conditions, and structural closure over actual applied content. The reviewer independently passed all 154 unit tests, core TypeScript, lint, formatting, and whitespace checks and reran the structural reproduction. Root additionally verified all nine storage contracts on PostgreSQL and MongoDB. M1 is complete as a pure planning domain; durable storage and operation execution retain their later gates.

### M2 adapter foundation implementation

A fresh phase implementation agent coordinated separate MongoDB, Drizzle/wrapper, D1 atomic batch, and adapter-contract agents. `registerBranchStorage` prepares typed per-entity head, pin-root, and visibility collections and native version metadata only for explicitly selected drafts-enabled configs. It leaves versions-disabled and history-only entities unchanged. Registration is internal and does not activate the branch engine. Native parent columns and version IDs retain each adapter's actual ID types; native version mutations verify the real entity, collection parent, and exact generation.

Discard stores an absent tombstone rather than deleting the scoped head row. Its durable incarnation advances, and recreation atomically checks that same incarnation before restarting logical head generation at one. Batch execution accepts all source, destination, and inherited read conditions. It writes a nonce under the native generation/incarnation guard for every observed row, including absence, so read dependencies participate in transaction conflict detection instead of permitting snapshot-isolation write skew. Every batch uses the caller's request/session and never independently commits it. Any failed batch requires its owner to roll back.

Native version initialization, freezing, and replacement run against real version rows under the active caller transaction. Replacement requires exact generation, same owner and unfrozen state, and advances the revision generation before nested/localized writes. A freeze is permanent. Head content, structural dependencies and newly captured base references are frozen and recorded as durable pin roots before reference persistence. An immutable or differently owned autosave uses copy on write. Generic legacy version writes cannot bypass these guards; ordinary later autosaves preserve a frozen snapshot by creating another native version.

Internal branch snapshots carry `branchOnly` origin metadata while preserving their stored historical statuses. Their creation does not alter the managed drafts latest marker. Legacy draft/published resolution, version history, by-ID history reads and restore exclude those snapshots, including snapshots that still contain historical `_status: published` and the inherited-read-policy prefetch path. Legacy history serializers return a new envelope with private revision/ownership/origin metadata removed while raw adapter reads retain it. Root version metadata is hidden and explicitly omitted from GraphQL output/input schemas, preventing an accidental public API before M8. Logical identity allocation retains the native ordinary row and stores owning branch, live visibility, compatibility visibility and a visibility generation separately from content. Query enforcement of those visibility rules remains M3/M4/M6.

MongoDB capabilities honor configuration, verified connected replica-set/sharded transaction support and the active caller session. Runtime verification is cached for the live database handle and invalidated on disconnect; each operation still checks its session. PostgreSQL, SQLite and the Vercel wrapper honor their actual transaction configuration and connected driver API. Missing/expired sessions are rejected rather than falling back to a nontransactional connection. SQLite admits one active interactive writer per adapter instance: a contender receives typed `SQLITE_BUSY` before native `BEGIN`, and the lease remains held until native commit/rollback settles. There is no automatic queue or retry; independent caller transactions must handle this conflict. This avoids a failed LibSQL `BEGIN IMMEDIATE` leaving its shared connection unusable. Separate native database clients may still encounter genuine SQLite lock errors, which propagate normally. Shared Drizzle transaction completion now distinguishes an intentional rollback signal from native failure: real begin/commit/rollback errors reach the caller, the session registry is cleared, and an original commit error survives cleanup failure. Third-party adapters may omit the new optional boundary and continue using legacy drafts; internal branch operations then fail clearly.

D1 explicitly reports no interactive transactions. Its separate trusted `executeAtomicBatch` primitive compiles guarded statements into one real D1 batch, inserting an in-batch assertion after each expected row-count check. A stale zero-row CAS raises inside that batch and rolls back preceding writes. It rejects caller interactive transactions and bounds SQL size, statements and parameters. This is an adapter primitive for the future M4/M5 domain compiler, not a public raw SQL branch API or completed D1 publication engine. The dedicated-batch capability flag refers only to an implemented `executeAtomicBatch`; interactive adapters advertise their separate transaction capability.

Pre-review evidence includes 23 new adapter contracts passing SQLite, MongoDB and PostgreSQL, native unit checks and all changed package typechecks. Actual local D1 tests cover successful guards, competing same-generation batches, zero-row guards after earlier writes, later statement failure, session consistency, bounds and sanitized errors. The Vercel wrapper is exercised separately through its real factory with the documented local PostgreSQL driver path; hosted Neon transport requires the later release matrix. Independent overlapping-transaction checks and final full fixture counts are recorded after review.

M2 deliberately freezes every durable head reference. M4 must add and validate atomic exclusive mutable working-head autosave coalescing without weakening pin safety, so existing repeated-autosave behavior passes through the new engine. Pin metadata is a retention root, not a completed GC implementation. Before activation, M6 must make `enforceMaxVersions`, adapter `deleteVersions`, branch lifecycle and file cleanup honor head/base/structural/schedule/pin roots, including a pinned version followed by enough ordinary autosaves to exceed `maxPerDoc`. A repeated no-op freeze cannot be assumed to lock an already frozen version against GC: M6 needs an explicit touch or equivalent conditional deletion protocol. No retention or file-safety signoff follows from version mutation guards alone.

Final M2 candidate verification: all 65 integration contracts pass on SQLite with interactive transactions enabled, MongoDB replica-set transactions, PostgreSQL, and the actual Vercel wrapper factory using its local PostgreSQL transport. Four dedicated independent-caller concurrency tests cover competing head changes with loser pin cleanup, pin-before-autosave and autosave-before-pin orders, and opposite destination writes guarded by shared read sets. MongoDB/PostgreSQL coordinate overlapping transaction reads; SQLite documents its single-writer admission and preserves stale observations for conflict checking. Subsequent ordinary operations and per-test fixture resets remain usable after rejected contenders.

All 232 focused unit/native/source-fixture checks pass, including 25 real local D1 tests and four D1 wrapper tests. Fourteen transaction fault/admission tests verify delayed commits, intentional rollback, real begin/commit/rollback failures, cleanup failure, pending native begins, competing/unknown/duplicate IDs, and lease release. TypeScript checks pass for Payload, GraphQL, MongoDB, Drizzle, PostgreSQL, SQLite, Vercel PostgreSQL and D1 SQLite. Targeted lint and formatting pass; the dedicated fixture types are regenerated and unrelated generated community types are restored. No rendered UI changed and no new accessibility conformance evidence is claimed. Independent review found and verified fixes for inherited version-prefetch filtering, metadata privacy, genuine overlap coverage, swallowed transaction errors and the LibSQL competing-begin connection defect. Final independent approval and the full existing versions regressions are recorded by the root agent before M2 is marked complete.

Independent final M2 review approved the source and documentation with no remaining findings; the reviewer separately passed 50 focused native/transaction checks. Root verified all 146 existing versions tests on PostgreSQL with native transactions and all 146 on default SQLite. Together with the final four-adapter fixture matrix, these satisfy the M2 gate. The explicitly deferred activation, mutable working-head autosave, query, retention, D1 compiler and hosted transport work retain their later milestone gates.

### M3 effective query implementation in progress

**Current gate — user direction, 2026-10-22:** prioritize functionality. M3 requires query correctness, access/locale/snapshot safety and proper native indexes/query plans. It no longer requires a 2x timing ceiling, fresh timed reruns or the 48-case matrix. Broader performance optimization is deferred until functionality is implemented, including in M4/M11. Independent final review of this revised gate passed; see M3_INDEX_FUNCTIONALITY_REVIEW.md. The following implementation/evidence narrative is historical where it calls for timed gates; those prerequisites are superseded, while failed measurements and functional follow-ups remain accurately retained.

M3 remains unchecked pending corrective CI review, the measured performance gate and independent final phase review. The native correctness matrix below passed before additional custom-schema and benchmark diagnostic findings; corrective layers #18936–#18938 have independent source and focused native approval. Separate fresh implementation agents own schema/codec, MongoDB native queries, Drizzle native queries, atomic projection maintenance, existing-ID compatibility, the large-data benchmark and the raw graph snapshot boundary. No legacy operation has been switched to the new relation.

The experimental query index uses hidden schema-derived collections with private fixed SHA-256 physical keys. Its actual typed logical document and row identities remain in native queryable columns; declared relationship values have private decoding metadata checked by re-encoding before results escape. Opaque JSON/editor content is unchanged. The index is rebuildable, and selected version revisions plus heads remain authoritative. Original hooks/access are never replaced by the hidden collection's access policy. The ordinary published read path does not consult these schemas.

Head and identity visibility mutations synchronously rebuild the changed identity for each registered affected branch in the caller transaction. Real main-generation writes guard bootstrap versus publication, including a previously absent branch. A per-scope generation and counted dirty queue reject incomplete projections before predicates; exact dirty revision plus lifetime nonce prevents settling a replacement invalidation with an earlier rebuild. Structural inheritance conflicts permit main to commit, atomically remove the conflicting locale from the index and mark that locale unavailable. Unaffected locales remain usable; explicit reconciliation clears the conflict. M8 must expose an authorized paged conflict inventory and explicit rebase/include-shared/discard recovery, with M10 UI.

Native query compilers apply visibility and original target read predicates at user relationship hops, including ordinary targets. Trusted server access expressions evaluate against the same effective relation without recursively reapplying target policies inside those expressions; no public parameter can select that internal mode. Typed logical ID comparisons, sort tie breakers and polymorphic values must use real typed columns rather than private key ordering. Array equality and polymorphic literal query shapes retain existing semantics.

Drizzle's raw page, relational row fetch, reverse joins and total are one native statement. An empty-page fallback can return only if the page is still empty at its count snapshot; otherwise it returns a typed conflict before hooks. MongoDB uses correlated native lookups and a root aggregate rather than application-side override-ID inventories. The internal raw read entry point includes guard capture, original entity access predicate compilation, native paging/count, freshness validation and private-key decoding. Operation-wide forward population, negative lookup caching and hook execution require a verified frozen raw graph, not merely successful root generation checks. Native helper proofs now cover PostgreSQL READ COMMITTED full-result revalidation with read-your-writes, pinned Mongo snapshot read sessions and default caller snapshot concerns, real D1 atomic trace validation, and bounded positive/negative/cyclic forward graphs. Read-only request capabilities are opaque, immutable and revoked on every completion path; native Request brands, original Payload arrow methods, nested Local API hooks, per-query locale views and fresh loaders are preserved. The complete native correctness matrix and independent production source review pass. The performance gate and final phase approval remain open.

Existing-ID compatibility has actual native evidence: a 2640-byte incompressible custom ID accepted by the ordinary PostgreSQL primary key now passes head/pin/visibility/dirty-queue/projection lifecycle, relationship decoding and rollback. Fixed-size unique coordinate keys avoid adding branch/scope bytes to an already valid near-limit source key; stored original coordinates are checked, and numeric/string aliases are rejected against the source schema. SQLite and MongoDB pass the same wide-ID pipeline. Existing MongoDB numeric custom IDs 1.5 and relationship 2.5 also pass ordinary and branch pipelines; finite logical numbers are preserved independently of integer version revision, generation and incarnation counters.

The opt-in benchmark seeds actual 10k/100k authoritative and projection rows over sparse/dense ownership, 2/10 locales and 1/20 branches, with representative deep blocks, fanout and long histories. It must report native draft, native index and full raw branch protocol layers separately, including guard/access compilation/decoding/graph snapshot overhead; no 2x claim may exclude those costs. Actual SQLite, PostgreSQL and MongoDB 10k diagnostic datasets have been exercised. Earlier scalar and depth-2 failures are retained in benchmark evidence; later optimizations require fresh source-pinned runs. The implementation benchmark adopts a ceiling of 2x the equivalent current draft workload for both p50 and p95, including the verified raw snapshot/graph protocol. The final 48-case matrix has not been completed, and no performance approval is claimed. M4 and M11 must rerun the public operation path after hooks/population are activated.

The latest committed-source 10k diagnostics at source `ff96a533d449` and commit `eef87202d4` pass all five scalar workloads and the depth-two graph on MongoDB, PostgreSQL and SQLite with forty measured samples each. Graph p50/p95 ratios are 1.887x/1.852x, 1.508x/1.486x and 1.460x/1.469x respectively. PostgreSQL nested reads now pass at 0.287x/0.294x after restoring ranked joined paging; SQLite selective reads pass at 1.515x/1.525x after retaining exclusively leased local read clients. Actual private SQLite events include BEGIN, the fused readiness SELECT, projection SELECT and COMMIT. All-locale authority/cache, caller transaction and ordinary/heavy maintenance proofs pass. Older failed diagnostics remain retained. These are diagnostic results only. The early largest PostgreSQL run subsequently loaded 63.61 million rows in 27.45 minutes, used 14.07 GiB of native storage and peaked at 724.6 MiB of integration-worker RSS. All 84 authority coordinates, all ten locales, graph/caller checks and ordinary/heavy maintenance across all 21 branches passed. Four scalar workloads and graph pass their budgets, but French membership/sort fails at 3.062x/3.046x. Its executed plan requires a fresh correction and independent review before rerunning the affected gate and complete 48-case final matrix. Database-server memory is not separately profiled. Final phase approval remains outstanding.

M3 late compatibility evidence includes actual native global read IDs (separate from update responses), positive/negative ID predicates and access, forward global graphs without a materialized native singleton, default/single/fallback/all locale relationship discovery, recursive Select including block-slug layers, exact omitted/null projection replacement before Mongo predicates, fractional logical row IDs, and valid near-limit PostgreSQL indexes through named/transparent tabs. Private nested table/enum names are bounded and namespaced, rather than inheriting live schema names. Native version/generation/incarnation identifiers remain integer guarded.

M4/M8 must define and implement schema-complement scope ownership for released MongoDB `allowAdditionalKeys: true` content; M9 requires a real upgrade fixture preserving unknown root and nested row keys. Unknown values should inherit their nearest declared localized container's ownership, otherwise shared, while remaining opaque and excluding system/private metadata. Actual released native query/write behavior determines predicate compatibility. Until that contract is implemented, experimental query registration rejects this mode and the legacy route remains available; no migration may silently discard these values. M4/M11 also must add editor-specific Lexical/Slate raw reference discovery before automatic rich-text population can claim the same frozen graph contract. Explicit nested Local API reads currently retain legacy selection; inherited selected-branch routing is M4 work.

M3 scalar-status clarification from released behavior: an en-only scalar published document remains published when another configured locale has no live head. The current runtime infers localized status for schemas containing localized fields; genuine scalar native coverage therefore uses a shared-only collection while separately asserting the observed localized status map. Absent/absent selections are neutral; live shared content and equality to current live selections are required. Localized content requires at least one live locale head, while nonlocalized content has no locale requirement. All withdrawn/absent locale publication stays draft. Localized map status preserves absent-locale draft. Native read policy/filter coverage must test this independently of the historical statuses saved in selected versions.

Final M3 admission review resolved transaction identity and lifetime findings: read scopes privately pin their native transaction identity, reject replacement/deletion/redefinition of the supplied request identity and unregistered nested copies, revalidate queued operations immediately before native execution, and reject expired caller sessions/registries before adapter fallback. Independent native admission/lifecycle/query proofs pass and the correction is approved. These checks apply to the supplied read capability; ordinary caller requests retain their transaction lifecycle. Explicit weaker MongoDB concern configurations still require M4/M9 admission and migration preflight. M3 remains unchecked until performance and final phase review pass.

M4 serializer parity must distinguish the raw head query status map from the released public response shape. With untranslated French content, current native SQL locale `all` can omit the French status key while MongoDB fills it with `draft`; the internal projection synthesizes a complete locale status map. Compare actual legacy `en`, `fr` and `all` returns, including missing status keys, before wiring public serializers. M9 must retain an untranslated-status upgrade fixture for each source schema/adapter generation. This internal M3 query contract does not establish public status-shape parity.

The dense PostgreSQL locale correction has now passed independent source and native review. Registered private root-locale tables receive a safely quoted raw branch key and branch/locale index, and localized-root ordering uses a branch-filtered root relation. Locale joins retain branch restrictions inside ON; ordinary root-index paths remain direct. No locale rows are invented, and legal source-field lookalikes remain distinct from the raw namespace. Owner checks passed 64 focused/native D1 cases, 30 query/guard cases each on PostgreSQL, custom PostgreSQL and SQLite, and separately added two-working-branch cases on five adapter routes. Independent review reran all 64 focused/native D1 cases and four custom-schema PostgreSQL cases against the frozen twelve files. Scratch native parity proves the plan change is feasible, but its duration under concurrent work is not performance acceptance. Fresh committed-source diagnostics and the complete final 48-scenario matrix remain outstanding; M3 remains unchecked.

The two latest corrective drafts are #18961 (PostgreSQL branch-scoped locale planning) and #18962 (Lexical current editability/history). Fresh source `ee5233333f4b` / HEAD `8585bbdda5` passes all three 10k/two-locale/one-branch/.01 diagnostics with forty samples plus five warmups and full correctness/maintenance proofs. Independent raw-sample and artifact audit confirms the small gates; the affected largest PostgreSQL diagnostic and all 48 final scenarios remain pending. The editor draft's CustomID CI job failed before any tests ran during Next Google-font resolution; this is under separate evidence review, with no source correction inferred. M3 remains unchecked and later implementation phases remain outstanding.

The affected new-source largest PostgreSQL diagnostic now passes all scalar and graph budgets at `ee5233333f4b` / `8585bbdda5`: selective .986/1.010, range .781/.814, relationship .021/.023, nested .707/.703, French membership/sort 1.141/1.169 and graph 1.785/1.836 (p50/p95 ratios). Exact loading inserted 63,610,000 rows via 131,600 calls; the measured seed phase took 1,728.106 seconds. All 84 authority coordinates, 660-coordinate graph/caller checks and ordinary/heavy maintenance across 21 branches pass. Native storage is 16,268,043,043 bytes (15.15 GiB); peak worker RSS is 836,320 KiB (816.7 MiB), excluding separately unprofiled database-server memory. The original failed report is preserved. Independent artifact review now approves all 880 samples, 39 native analyzed plans, retained hashes and measured budgets; this diagnostic does not satisfy any of the 48 final-matrix scenarios. The CustomID CI failure was independently identified as a Google font download timeout before test execution; one failed-job rerun passes, leaving draft #18962 with 290 passing and five skipped checks, zero pending or failing. No source change was required for that infrastructure event. M3 remains unchecked.

The executed largest French plan uses a once-fenced 100k-root relation and 100k parent/locale unique-index probes, rather than the scratch HashJoin or selection of the new branch/locale index for that join. All current and historical evidence hashes are retained and independently verified. Full final-matrix execution is the next M3 gate.

The first same-source final-matrix attempt stopped at its third MongoDB scenario. Two 10k/two-locale/one-working-branch sparse/dense scenario processes passed; 10k/two-locale/twenty-working-branch/.01 failed only the graph budget at 2.701/2.512x (26.261/27.096ms versus draft 9.725/10.789ms). All five scalar budgets, 84 authority coordinates, 660-coordinate graph/caller correctness and ordinary/heavy maintenance on all 21 branches pass. The complete partial batch, logs and failure are preserved. A fresh corrective owner is auditing the graph cost, with independent artifact review before further work. No PostgreSQL or SQLite final scenario has started, no threshold waiver was applied, and M3 remains incomplete. Any production correction requires new source pins and fresh final coverage; these two process passes do not carry across source changes.

A separate Mongo zero-identity prerequisite is independently approved. The native read transform now uses nullish fallback, preserving numeric zero before the existing BigInt conversion while retaining missing/null fallback and native-key precedence. The new tests reproduce the failure before the fix (two unit regressions and a real public-create failure). Owner and independent reviewer each pass fourteen transform cases and the genuine public-create/read/version-parent0/main-and-working-bootstrap/effective-row0 native regression. Mongo TypeScript, targeted lint and formatting pass. The prerequisite changes only the transform and two test files; the paused graph-targeting source remains a separate unpublished part. No new performance result or M3 phase approval is inferred.

The Mongo graph-targeting correction is independently approved against eight frozen files. Only the graph collector's already-known, typed, bounded requested IDs produce native primary-key targets; Mongo revalidates registered ownership and preserves the original logical predicate, visibility, access, sorting and snapshot. Globals, ordinary collections, incompatible IDs and configured collation retain existing paths. Core preparation now checks the verified Mongo runtime name before any target validation or encoding, so SQL adapters do no unused target-ID hashing. Owner and independent reviewer each pass 58 focused/private-boundary cases and two genuine native graph cases, including physically targeted related ID0/fractional cycles, wide text and numeric-string IDs, and case-equivalent collation fallback. Five targeted native Mongo snapshot/caller/revocation cases also pass; the 31 earlier native query/guard passes remain retained. Core/Mongo typechecks, targeted lint, formatting and whitespace checks pass. Read-only candidate plans preserve complete ordered results while reducing 50/20/20-ID batches from 1,050/420/420 examined documents to 50/20/20. These are correctness/design proofs, not accepted performance results. Fresh committed-source three-adapter small diagnostics, the affected Mongo twenty-branch gate and all 48 final scenarios remain required; M3 remains unchecked.

The new stack's remote unit job exposed two unrelated CLI scaffold issues, now independently resolved in a separate two-file part. Six project-creation cases timed out at five seconds and one example case at ninety seconds; the unchanged plugin test reproduced its timeout, with a sanitized observer showing a pending live npm metadata request. A strict deterministic npm fixture preserves the real resolver and filesystem work and exposed an unintended GitHub download after a successful local-example copy. The production change makes local-example/local-template/remote selection mutually exclusive. Owner and independent reviewer pass all eight creation and nine resolver tests with retries disabled and the original timeouts. CLI TypeScript, production-file lint, two-file formatting and whitespace checks pass. No timeout, dependency or production version-fetch behavior was changed. M3 performance coverage remains pending on the new committed head; all prior failed and passing reports remain preserved.

### 2026-10-22 functionality-first sequencing

The user reduced M3 benchmarking effort to checking proper indexes. Stop profiling and timing optimization; preserve existing benchmark reports unchanged. Review the existing PostgreSQL branch/locale root fence and native index probes, MongoDB encoded-primary-key targeting and SQLite query plans alongside the retained functional/access/snapshot proofs. Only concrete functional or index defects block M4. M4–M11 retain all original functional, migration, API, scheduling, asset, accessibility and review requirements. The old 2x and 48-case timing prerequisites in historical evidence above do not gate those phases.

Independent revised M3 phase review approved the current query foundation at `eb8b6464087957fe472a0b460530ed1ef3dd48b9`, with no concrete functional or missing-index blocker. The reviewer verified twelve PostgreSQL and eight MongoDB source hashes, actual retained PostgreSQL/MongoDB/SQLite native plans, and real D1 compatibility evidence. See [M3_INDEX_FUNCTIONALITY_REVIEW.md](./M3_INDEX_FUNCTIONALITY_REVIEW.md) for the assessed boundaries. M3 is complete under the revised scope; public writes, merges, scheduling, migration and Admin remain later work. Current top-stack CI passes unit and PostgreSQL/SQLite/MongoDB/DocumentDB suites; CosmosDB/Firestore failures remain under separate investigation, so full CI is not claimed green.

### M4 first functional slice — managed working-save persistence

The first slice integrates normal public collection create/update/working restore and global-update version persistence with the internal head engine after verified authoritative cutover. It captures and guards main/drafts observations before candidate callbacks, preserves original merge bases, retains original request/hook semantics and caller rollback, and builds heads/projections from canonical persisted native bodies. Live head snapshots use actual native materialization so sibling draft locales cannot become published through a single-locale history snapshot. Retention prunes genuine unprotected history while preserving durable version roots and matching upload cleanup candidates.

Private cutover storage is authoritative and separate from rebuildable projections. An absent receipt preserves legacy drafts; an existing invalid/inactive receipt refuses writes. Atomic receipt dependency/revalidation and head CAS reject mid-hook revocation and stale nested writes without replaying hooks. Arbitrary application custom keys do not activate the engine. Migration and supported activation remain M9 work.

Owner and independent reviewer each pass all thirteen focused tests on SQLite, PostgreSQL and MongoDB. The reviewer also passes four registration units and verifies all thirteen frozen source hashes before and after testing; core TypeScript, targeted formatting/lint and whitespace checks pass. All native/generator workers have stopped; only proven task-generated unrelated community types were restored. No benchmark was run.

This is not M4 completion. Authoritative original/read routing and named context are next, followed by nested/public read routing, exclusive autosave coalescing, global restore parity, schema/editor reference discovery, full upload/GC boundaries, real D1 atomic write compilation and existing-suite engine regressions. M4 remains unchecked until those functional requirements and independent phase review pass.

### M4 part 2A — selected operation originals

The next slice uses privately selected working branches for collection update/restore originals, bulk membership and global update candidates. Root operation authorization remains separate from relationship read policies. Selected working writes cannot publish main or replace managed drafts latest. Native status-key presence, global ID shape, timestamps and caller transactions retain their existing operation contracts.

The implementation owner and independent reviewer each pass the 43-case selected-original/working-write suite on SQLite, PostgreSQL and MongoDB, 38 focused units and the actual native Mongo root-policy geospatial case. Core/Mongo/Drizzle TypeScript, targeted formatting/lint and whitespace checks pass; existing lint warnings remain. Independent review approves all 30 frozen source files, verified before and after execution. Review identified and corrected late authority adoption after an explicitly observed legacy original or bulk candidate selection. Actual callback activation regressions cover both cases. This slice does not complete public selected reads, nested loaders or named-anchor suppression on ordinary reads; activation remains gated by the remaining M4 and M9 work.
