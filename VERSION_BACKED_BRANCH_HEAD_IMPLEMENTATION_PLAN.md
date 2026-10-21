Written with AI

# Version backed content branches implementation plan

Implement named content branches by extending Payload's versions and drafts engine. Versions store content; branch heads select versions; the ordinary collection and global tables remain the materialized representation used by existing live reads. Publishing is promotion into the published branch, initially `main`. A working branch does not contain a second independently publishable draft state.

This is an implementation specification with ordered delivery milestones. Complete the correctness and performance gates before enabling the new engine. Migration covers existing versions and `versions.drafts` data, including pending publish jobs. Migration from PR #17878 is explicitly excluded because that implementation was never released.

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

Derived query projections are permitted only as rebuildable caches; heads and versions remain authoritative. Their updates must be transactionally consistent or guarded by generation so stale cache data never determines permission or publication. If effective queries do not meet the performance gate, optimize this relation or add validated projections before building the full Admin. Do not claim the existing `queryDrafts` implementation already solves sparse locale overlays.

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
| M3 Effective queries        | Native effective content relations, access predicates, joins, count/sort/pagination/distinct and scope compilation     | Full query parity plus performance gate; no core unbounded shadow ID lists                             |
| M4 Working writes           | Legacy normalization, create/update/autosave/restore, nested transaction composition, status projection                | Existing versions suites pass through head engine; draft writes leave main unchanged                   |
| M5 Promotion and withdrawal | Arbitrary destination merge, scoped conflict checks, candidate validation, live materialization, source reconciliation | Drafts to staging to main plus locale subset and mixed shared structure integration tests              |
| M6 Lifecycle and assets     | Branch catalog permissions, visibility, discard, Trash/delete, retention roots, uploads, repair                        | Cross branch isolation and no retained file/version loss under GC races                                |
| M7 Scheduling and recovery  | Snapshots/latest policy, typed actor, durable receipts, cancellation, conflicts, retries, effect delivery              | Worker crash/retry and revoked actor tests; no unintended new publication                              |
| M8 Public API parity        | REST/GraphQL/SDK/CLI, types, validation errors, schema support boundaries                                              | Equivalent operation outcomes and negative access tests across interfaces                              |
| M9 Migration                | Adapter migrations, source fixtures, resumability, verification report, cutover/rollback tooling                       | Supported released data upgrades without read/content/schedule loss                                    |
| M10 Admin                   | Existing drafts flows plus named branch review, locale actions, scheduling and results                                 | Browser flow tests, accessibility evidence, translations, production bundling, Docker visual baselines |
| M11 Release                 | Full adapter/plugin matrix, load tests, documentation, examples, upgrade rehearsal                                     | All release gates below met; operational limits documented                                             |

M0 and M1 start implementation. M2 and M3 establish whether the chosen representation can serve real queries. Do not build an Admin over a head engine with unproven database semantics. Develop migration fixtures early in M0 and migration logic alongside M2/M4; M9 is the complete cutover rehearsal, not the first migration work.

Deliver small reviewable changes in this order. Core package fixes use `fix:` without a payload scope; UI fixes use `fix(ui):`. Feature work uses appropriate Conventional Commit titles. External PR descriptions and comments begin with Written with AI. Do not commit unrelated local review notes.

## Test and release gates

Pure tests cover scope resolution, state tokens, inheritance, withdrawal, selection normalization, stale bases, structural incompatibility, and transition planning. Integration tests use `test/__helpers/int/vitest.ts` and one root fixture suite; fixtures own database setup/reset. Clean up files, queue side effects, environment changes, and external resources explicitly.

Add a dedicated head-engine integration suite plus regressions in existing versions, localization, file-versioning, cloud-storage, queues, GraphQL, REST, and generated type suites. Tests should assert observable content and storage safety, not mirror helper implementation.

Required concurrency/failure cases: first inherited write in caller transaction; two autosaves; autosave racing pin; source edited during merge; destination edited after preflight; shared structure changed under a locale; overlapping schedules; cancellation racing execution; commit acknowledgement lost; cleanup failed after commit; GC racing a new pin; duplicate worker execution; failed uniqueness reservation; and hooks altering candidate data.

Performance fixtures include 10k and 100k logical documents, sparse and dense overrides, 2 and 10 locales, deeply nested blocks, high relationship fanout, 1 and 20 branches, and long version histories. Compare p50/p95, database calls, rows examined, memory, and write amplification against current published/draft reads. Published queries must retain their normal indexed path. Set a working-query p95 budget before M3 signoff; a suggested initial ceiling is 2x the equivalent current draft query on the same dataset. Any exception needs an explicit supported limit and benchmark, not silent fallback.

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

Release requires data migration comparison and interrupted retry tests; a working drafts/staging/main flow; per locale and all locale publish/withdraw/schedules; API access parity; upload retention; honest adapter transaction capabilities; query performance results; existing drafts regressions passing; and documented upgrade/rollback instructions. Every remaining limitation has an explicit behavior and test rather than an unspecified fallback.

## Implementation progress

- [x] Record full implementation scope and existing drafts migration requirements.
- [x] Create local implementation branch `feat/version-backed-branch-heads`.
- [x] M0 Characterize the legacy contracts and create migration fixtures.
- [ ] M1 Implement and test the internal head domain and resolution rules.
- [ ] M2 through M11 Implement and verify the remaining milestones in order.

M1 is in progress in `packages/payload/src/versions/branches`. Implemented internal scope/head/version types, scope resolution with inheritance and explicit withdrawal, generation/state comparisons, complete read set comparisons, and single scope promotion planning with destination conflicts and shared structure preconditions. Promotion into an inheriting destination establishes an owned head even when content already matches, preserving reviewed staging content against later main changes.

Initial verification on Node 24.15.0: 47 focused unit tests passed; targeted oxlint, oxfmt, and strict standalone TypeScript checking passed. Two regression cases for matching inherited content failed before the ownership fix and passed afterward. These tests exercise the domain without database IO; they do not establish adapter atomicity, runtime API integration, migration correctness, or rendered accessibility.

Next: complete M0 characterization and upgrade fixtures before modifying existing runtime behavior, finish selection/base receipt planning in M1, then add typed head persistence and freeze/pin adapter contracts in M2. No feature is enabled by the current internal types and pure utilities.

### Draft review stack

The stack starts at main. Each layer targets the preceding branch so reviewers see its incremental diff. This is an initial implementation stack; it does not complete M0 through M11 or enable the feature.

| Layer | Draft                                                      | Delivered scope                                                                                                |
| ----- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1     | [#18898](https://github.com/payloadcms/payload/pull/18898) | Head domain, generation comparisons, scope merge planning, and implementation specification                    |
| 2     | [#18899](https://github.com/payloadcms/payload/pull/18899) | Existing drafts compatibility fixture and eight baseline SQLite contracts                                      |
| 3     | [#18900](https://github.com/payloadcms/payload/pull/18900) | Fix collection Local API restoration dropping its draft flag, with a failing-before/passing-after regression   |
| 4     | [#18901](https://github.com/payloadcms/payload/pull/18901) | Schema compiled scope projection/composition, typed row matching, and real stored-content integration evidence |
| 5     | [#18902](https://github.com/payloadcms/payload/pull/18902) | Internal per-entity head schemas, native generation guards, unique first creation, and corruption checks       |
| 6     | [#18903](https://github.com/payloadcms/payload/pull/18903) | Pure existing-drafts head planning and persistence verification without changing live content/history          |

Current implementation state as of 2026-10-21:

- M0 now has executable live/working, localized publish/withdraw, autosave, restore, validation, global, Local/REST/GraphQL/SDK read parity, access, and pending-job baselines. Genuine published-package SQLite exports cover stable 3.91.0 scalar statuses and current 4.0.0-beta.3 localized statuses. Independent phase review and full existing-suite evidence are recorded below before signoff; adapter-specific source upgrade rehearsals remain M9.
- M1 includes the scope compiler and content composition as well as the original head domain. Batch selection, full merge-base/receipt planning, and operation integration remain.
- M2 has native head persistence registered only in the test fixture. Version freezing/pinning and runtime capability/registration contracts remain. All 19 initial integration contracts, including storage races, pass locally on SQLite, MongoDB, and PostgreSQL. Isolated temporary MongoDB and PostgreSQL services provide the latter two checks; wrapper capabilities remain unverified.
- M9 has a per-identity planning primitive that distinguishes actual materialization from resolved working snapshots, handles scalar/localized statuses, retains unpublished working content, and preserves legacy draft metadata references. It does not execute schema migration, freeze versions, resolve historical source generations, migrate jobs, or activate the engine.
- M3 through M8 and M10 through M11 remain outstanding. In particular, effective indexed branch queries, complete operation/access/hook integration, live materialization, schedules, retention/GC, public APIs, migration cutover, and Admin flows are not implemented.

The collection Local API restore fix passes its new regression and 15 selected existing restore regressions against SQLite. No rendered UI has changed, so this stack supplies no new browser, screen-reader, or accessibility conformance evidence. Review descriptions distinguish each layer's tests from the remaining release gates.

### Independent review gates

The complete six-layer stack received an independent subagent review before further phase implementation. The reviewer found one blocking migration issue: shared row reordering incorrectly created locale overrides for unchanged translations, preventing subsequent main translations from inheriting. A separate implementation agent fixed recursive locale comparison to use typed row identities while preserving localized container order. Independent re-review passed with no remaining blocking findings. All 107 branch unit tests pass; the two migration integration tests pass on SQLite, PostgreSQL, and MongoDB.

Each subsequent milestone has a fresh implementation agent and a separate review agent. Findings are fixed and re-reviewed before advancing. A milestone remains incomplete until its stated evidence gate is satisfied; draft PR creation alone does not satisfy that gate.

### M0 contract baseline implementation

A fresh M0 implementation agent extended `test/version-branches` to 33 integration contracts. The phase characterizes existing permissive-anchor visibility, published access predicates, forbidden anonymous version/write access, working-query counts/sort/page, REST/GraphQL/SDK working reads, required-field publication validation, global restoration, latest-at-execution collection/global schedules, typed/deleted/bare scheduling actors, and legacy withdrawal behavior. `test/version-branches/CONTRACTS.md` maps these tests and existing versions/localization suites to the compatibility requirements and names intentional future changes.

The source fixtures were generated by isolated immutable npm installs of `payload` and `@payloadcms/db-sqlite` at 3.91.0 and 4.0.0-beta.3. They contain actual SQLite DDL, full raw content/version/locale/row tables, incomplete unpublished identities, globals, pending job inputs, observed live/working API views, npm integrity provenance, and SHA-256 hashes. Both exports reproduced byte-for-byte from newly generated databases. Two independent in-memory SQLite replay tests verify importability, foreign keys, history, pending schedules, and scalar versus localized status storage. These are source contract fixtures; they do not claim that schema/status/head/job migration or cutover is implemented. MongoDB/PostgreSQL released source exports and the complete supported release range remain M9 gates.

Pre-review checks: all 33 integration contracts pass on SQLite, PostgreSQL, and MongoDB. The full existing versions SQLite suite passes all 146 tests. All 109 unit tests (107 head tests and two source fixture replays), core TypeScript, targeted lint, formatting, and git diff whitespace checks pass. Independent M0 review passed after removing duplicate properties in typed-actor tests. The reviewer independently replayed both source fixtures and checked lint and whitespace. M0 is complete; native released-source upgrade rehearsals, migration execution, and browser verification retain their later milestone gates.
