# Content Branching for Payload — Design Proposal

**Status:** Design approved; implementation in progress on `feat/content-branching`.
Targets Payload 4.0.

**Implemented and verified on MongoDB, Postgres and SQLite:** phase 0 spike; config surface and
exclusions; schema injection and unique-index rewriting; branch resolution across the request; the
change manifest; the read predicate and canonical-ID translation wired through `db-mongodb` and
`drizzle`; copy-on-write updates; tombstone deletes; drafts, versions and publishing per branch;
globals; branch-aware joins; merge with selective apply, `dryRun`, `main-moved` warnings, and branch
lifecycle hooks.

The full loop works: branch, edit in isolation, review what changed, merge some or all of it back.

**Not yet implemented:** the per-document access preflight (§13.3), `updateMany` / `deleteMany`,
dangling-reference warnings, and UI. See §19 for phasing.

**Security note:** `merge()` currently runs with `overrideAccess: true` and performs no per-document
permission checking. The preflight in §13.3 is the enforcement boundary the access design depends on,
and should land before this is used anywhere real.

---

## Summary

Content branching lets an editor create a named branch (`halloween-updates`), create, update, delete,
and publish documents on it in isolation, review what changed, and merge selected changes back to
`main` — without any of it being visible in production until merge.

**The mechanism in brief.** A document edited on a branch is stored as a _real row in the same table_
as the production document, tagged with a `_branch` column. Reads on a branch add one predicate that
selects the branch's rows plus the main rows the branch hasn't touched. Because branch state lives in
the table, the database does the filtering — so `totalDocs`, pagination, sorting, and `count` are all
correct without any post-query fixup.

**Where it lives.** In core, not a plugin. The deciding factor is `joins`, which are resolved inside
the database adapters where no plugin can reach (§4).

**What's settled and what isn't.** §21 lists the decisions already made and why. §22 lists the two
questions still open. Everything else in the document is a proposal to be critiqued.

**Cost of not using it.** With `branching` unset: no columns injected, no predicate appended, no
internal collections registered, no migration. The 3.x → 4.x upgrade is unaffected.

---

## Terminology

| Term                   | Meaning                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **main**               | Production content. Not a row in the branches table — a reserved sentinel value in the `_branch` column. |
| **branch**             | A named workspace. A row in `payload-branches`, identified by an immutable `slug`.                       |
| **shadow row**         | A branch's copy of a document, living in the same table as the original, tagged `_branch = <slug>`.      |
| **fork**               | Creating a shadow row for a document the first time it's edited on a branch (copy-on-write).             |
| **tombstone**          | A shadow row marking a document as deleted on that branch.                                               |
| **changeset registry** | `payload-branch-changes` — an index of every document a branch has touched. Holds no content.            |
| **manifest**           | The registry rows for one branch, loaded once per request to build the read predicate.                   |
| **selective merge**    | Merging a chosen subset of a branch's changes, leaving the rest on the branch.                           |

---

## 1. Goals and non-goals

**Goals**

- Create, update, delete, and publish documents on a branch with no effect on production.
- Correct `find` semantics on a branch: pagination, `totalDocs`, sorting, filtering, and `count` must
  be computed by the database, not patched afterwards.
- Drafts and versions work on branches from day one.
- Branch selection is stable across Local API, REST, and GraphQL.
- Access control governs who can branch, who can see a branch, and who can merge — expressed with
  Payload's existing access primitives rather than a parallel system.
- All document hooks fire on merge, so cache invalidation and front-end rebuilds work.
- Enabling and disabling is as close to frictionless as the database allows.

**Non-goals for v1**

- Field-level conflict resolution or three-way merge. Branch data wins; selection is the control.
- Branch-from-branch and rebase.
- A workflow/approval system. Branching is the mechanism; opinionated workflow belongs on top.

---

## 2. The central constraint

A design that tracks branch changes _outside_ the queried table and reassembles documents after the
query returns cannot be correct. Any query that filters or sorts on a branch-modified field returns
the wrong set:

```ts
// main:   { id: 1, title: 'Autumn Sale' }
// branch: { id: 1, title: 'Halloween Sale' }   ← changeset row held elsewhere

payload.find({ collection: 'pages', where: { title: { like: 'Halloween' } } })
// The DB matches against main's 'Autumn Sale' → doc 1 never enters the result page.
// No post-query overlay can add it back: it was never in the page.
```

The same breaks `sort: 'title'`, `count`, `totalDocs`, `findDistinct`, and `group-by`.

Therefore **a branch's version of a document must be a real row in the same table**, so a single query
can filter, sort, and paginate across main rows and branch rows together. Everything else in this
document follows from that.

Note that this is also why the versions architecture can't be copied directly. Versions put rows in a
sibling table (`_pages_versions`) and `queryDrafts` reads that table _instead of_ `pages`. A branch
read is main rows **unioned with** branch rows, and a cross-table union with correct pagination isn't
expressible through Payload's query builder on both Mongo and Drizzle.

---

## 3. Data model: copy-on-write rows

Branch rows live in the collection's own table, discriminated by a column:

| Row                    | `_branch`     | `_branchDocID` | `_branchOp` | Meaning                             |
| ---------------------- | ------------- | -------------- | ----------- | ----------------------------------- |
| main document          | `'main'`      | `null`         | `null`      | production content                  |
| edited on `halloween`  | `'halloween'` | `<main id>`    | `update`    | full copy with branch edits applied |
| created on `halloween` | `'halloween'` | `<own id>`     | `create`    | exists only on the branch           |
| deleted on `halloween` | `'halloween'` | `<main id>`    | `delete`    | tombstone                           |

A read on branch `B`:

```ts
{
  and: [
    userWhere,
    {
      or: [
        { _branch: { equals: B } },
        { and: [{ _branch: { equals: 'main' } }, { id: { not_in: shadowedIDs } }] },
      ],
    },
    { _branchOp: { not_equals: 'delete' } },
  ]
}
```

A read on main is `{ and: [userWhere, { _branch: { equals: 'main' } }] }` — a single indexed equality.

**Why `main` is a sentinel string rather than `NULL`.** Postgres treats `NULL`s as distinct in unique
indexes. With `_branch = NULL` for main rows, a compound `(slug, _branch)` unique index would stop
enforcing uniqueness among main rows entirely — two main pages could both claim `slug: 'about'`. A
non-null sentinel behaves identically on Postgres, SQLite, and Mongo.

---

## 4. Why this belongs in core rather than a plugin

### The deciding factor: `joins`

Join fields are resolved _inside_ the database adapters — `buildJoinAggregation` and `resolveJoins` in
`db-mongodb`, join subqueries in `drizzle`. They are constructed below any layer a plugin can reach. A
plugin can wrap `payload.db.find`, but it cannot reach into the aggregation pipeline that `find` builds
internally.

In a plugin implementation, a `Posts` collection with a join field onto `Comments` returns _main's_
comments while the user is on a branch: comments created on the branch don't appear, and comments
deleted on the branch still do. That is the branch silently misreporting related content, in the exact
feature editorial dashboards are built from. The only fix is changing the adapters.

### Three supporting reasons

- **`req.branch` across all three APIs.** Stable branch selection means a typed `branch` option on every
  Local API operation, a parsed `branch` in `parseParams`, and a `branch` argument on generated GraphQL
  queries (`packages/graphql/src/schema/initCollections.ts`). All core files. A plugin's only ambient
  channel is an HTTP header plus `req.context`.
- **Schema and index generation.** Injecting `_branch` and rewriting `unique: true` into a branch-scoped
  compound index belongs in collection sanitization, next to how `trash` injects `deletedAt`. A plugin
  mutating index definitions from outside breaks quietly at migration-generation time.
- **The dataloader, the access layer, and `queryDrafts`** are core internals that must be branch-aware.

### This shape is not new for Payload

`versions` creates an entire sibling table when enabled. `trash` injects a column and appends a filter
to every read (`appendNonTrashedFilter`). `payload-locked-documents`, `payload-preferences`,
`payload-query-presets`, and `payload-jobs` are core-owned internal collections registered conditionally
from config. Branching is the same pattern at larger scale: a config flag, injected fields, a read
predicate, and two internal collections.

### Where each piece lives

| Layer                                                        | Package                                      |
| ------------------------------------------------------------ | -------------------------------------------- |
| `_branch` schema injection, unique-index rewriting           | `packages/payload` — collection sanitization |
| Read predicate, copy-on-write writes, tombstones             | `packages/payload` + each db adapter         |
| Branch-aware `joins`                                         | `db-mongodb`, `drizzle`                      |
| `req.branch` resolution; REST / GraphQL / Local API plumbing | `packages/payload`, `packages/graphql`       |
| `payload-branches`, `payload-branch-changes`                 | `packages/payload` — internal collections    |
| Merge engine, access preflight, branch hooks                 | `packages/payload`                           |
| Branch switcher, changed-documents view, merge UI            | `packages/ui`, `packages/next`               |

If a plugin eventually exists, it should be an optional workflow layer on top (approval chains, Slack
notifications), not the mechanism.

---

## 5. Excluding shadowed main rows

The predicate needs "main rows this branch has _not_ shadowed". Three ways to express it:

**(a) An array field on the main row (`_shadowedBy: string[]`) — rejected. Verified.** `hasMany` fields
live in a side table queried through a join, and `packages/drizzle/src/queries/parseParams.ts:290-330`
applies `not_in` as a `WHERE` over that join. The phase 0 spike
(`test/branching/spike.int.spec.ts`) confirms **two** independent defects on SQLite, where the query
`{ shadowedBy: { not_in: ['a'] } }` over three documents returned exactly the wrong one:

1. **Multiplicity leak.** A document shadowed on `['a','b']` is returned, because the join emits one row
   per value and the `'b'` row satisfies the constraint. Classic anti-join multiplicity — predicted.
2. **Empty-array exclusion.** A document shadowed on _nothing_ is dropped, because it produces no joined
   rows for the `WHERE` to match against. **Not predicted**, and the more damaging of the two: in a
   branch read this would hide every untouched main document, i.e. almost the entire result set.

Mongo's `$nin` behaves correctly on both counts, which is exactly why this would have survived a
Mongo-only test run and surfaced later as a relational-adapter-only bug.

**(b) A bounded `not_in` list — recommended, and implemented.** The exclusion compares a main row's
**own `id`**, not `_branchDocID`. This is a correction to an earlier version of this design, caught by
test: a main row's `_branchDocID` is null (meaning "self"), so comparing against it never matched and a
branch read returned _both_ copies of an edited document. For a main row the canonical ID simply is its
primary key, and `id` is a plain scalar column — no join, no anti-join hazard, and no nulls. Because branches are small, the branch's **entire change manifest loads in
one query** at the start of a request and is grouped by collection in memory and memoized on `req` —
one query per request regardless of how many collections the request touches. A `maxShadowedIDs`
ceiling (default ~2000) falls back to (c).

`_branchDocID` is still declared as a `relationship` field (§10), but for identity typing rather than
for this predicate: it has to inherit the collection's own ID type, which may be text, number, or a
custom ID. Its null-safety under `not_in` is no longer load-bearing now that the exclusion runs against
`id`.

**(c) A delimited scalar column — scale-up path.** `_shadowedBy: ',halloween,q4,'` queried with
`not_like`. Correct everywhere, unbounded branch size, not index-friendly. Build behind a flag if the
ceiling in (b) is ever hit.

---

## 6. Document identity

A shadow row's primary key is not the canonical document ID, but relationships, admin URLs, and API
consumers all use the canonical ID.

1. **Shadow rows** store `_branchDocID = <canonical id>`. Documents created on a branch store their own id.
2. **Main rows** leave `_branchDocID` null — null means "self".
3. **In branch context only**, recursively rewrite the `where` tree: every `id` constraint becomes
   `{ or: [{ _branchDocID: <c> }, { and: [{ _branchDocID: { exists: false } }, { id: <c> }] }] }`. The
   same rewrite applies to `sort: 'id'` and to the `id` argument that `db.updateOne` / `db.deleteOne`
   accept alongside `where`.
4. **On read**, project `id = _branchDocID ?? id`.
5. **On main**, none of this runs.

The rewrite must handle `and`/`or` nesting and every operator. It is the most test-worthy unit in the
feature and warrants DB-independent unit tests.

---

## 7. Drafts, versions, and publishing

Drafts work on branches with **no change to `latest` semantics**, which is why they ship in v1 rather
than as a later phase.

### Why `latest` needs no change

`latest` is scoped to `parent` — one flag per parent _row_. A shadow row is a distinct row with a
distinct primary key, so it is its own parent. The two version chains are independent by construction:

```
pages[1]                                        ← main published state
  _pages_versions[parent=1,   latest=true]      ← main's newest state

pages[456] (_branch=halloween, _branchDocID=1)  ← branch published state
  _pages_versions[parent=456, latest=true]      ← branch's newest state
```

A `latest: true` query returns both rows; the branch predicate picks the right one.

### Confirmed behavior this rests on

- `collections/operations/utilities/update.ts:363` — `if (!isSavingDraft)` guards the `db.updateOne` on
  the main table. **Saving a draft never touches the main row.** So `pages` holds published state (or a
  never-published document's initial state) and `_pages_versions[latest=true]` holds newest state.
- `db-mongodb/src/queryDrafts.ts` ends with `docs[i] = docs[i].version; docs[i].id = docs[i].parent`.

### Implementation

Inject `_branch` and `_branchParent` into version collection fields, then:

- **`find({ draft: false })` on a branch** — normal `find` with the §3 predicate; returns the branch's
  published state.
- **`find({ draft: true })` on a branch** — `queryDrafts` applies the same predicate against `_branch`
  and `_branchParent`; the final id mapping becomes `id = _branchParent ?? parent`.
- **Publishing on a branch** writes `_status: 'published'` to the shadow row and its version chain. Main
  is untouched, which makes "publish on a branch but not on main" a real operation rather than a
  permissions trick.

### Forking a document into a branch

1. Copy `pages[D]` to a new row `S` with `_branch = B`, `_branchDocID = D`, `_branchOp = 'update'`.
2. Copy main's `latest: true` version to a new version row with `parent = S`, `_branch = B`,
   `_branchParent = D`, `latest = true`. Copying the _latest_ version rather than the published row means
   the branch forks from what the editor last saw, including an unpublished draft.
3. Write a `payload-branch-changes` row recording `baseUpdatedAt` and `baseVersionID`.

Branch history starts at the fork point. Main's history is untouched.

### Effective production operation per document

This mapping drives both merge (§16) and the access preflight (§14):

| Branch state                       | Operation on merge                                    |
| ---------------------------------- | ----------------------------------------------------- |
| created on branch, draft           | `create`                                              |
| created on branch, published       | `create` + `publish`                                  |
| forked, branch latest is a draft   | `update` (draft only; main's published row untouched) |
| forked, branch latest is published | `publish`                                             |
| deleted on branch                  | `delete`                                              |

Merging draft-only work requires ordinary update permission; merging a publish requires publish
permission.

A branch may hold **both** a published state and a newer unpublished draft on top of it. Merge applies
both in sequence: publish the branch's published state to main, then apply the newer draft as a second
`draft: true` write. Main ends in exactly the state the branch was in. This costs two writes and
therefore two hook runs, which is correct — main genuinely undergoes two transitions, and anything
subscribed to publishes should observe the publish rather than have it collapsed into a draft save. The
access preflight checks both operations, so a user who can update but not publish is blocked on the
change as a whole rather than silently getting the draft half.

---

## 8. Globals

Globals are **in scope for v1**. They are structurally simpler than collections, not harder, and the
reason is worth stating up front because it looks like an exception to §2.

### Why the central constraint doesn't bind here

§2 requires branch state to live in the queried table because a paginated list must be filtered,
sorted, and counted by the database. A global is a single document: no list, no pagination, no
`totalDocs`, no sort. There is no result set to get wrong.

So a global can be resolved with a two-row fetch and an in-memory preference — read the branch's row
and main's row in one query, return the branch's if present. That would be incorrect for a collection
and is correct here, purely because there is nothing to paginate.

### How globals are stored

- **Mongo** — one `globals` collection using a mongoose discriminator on `globalType`
  (`packages/db-mongodb/src/models/buildGlobalModel.ts:13`). `findGlobal` runs
  `Model.findOne({ globalType: slug, ...where })` (`packages/db-mongodb/src/findGlobal.ts:27`).
- **Drizzle** — each global gets its own table, read via `findMany({ limit: 1, where })`
  (`packages/drizzle/src/findGlobal.ts:19-30`).

Both already read through a `where`, so the branch predicate is a contained change in each adapter.

### Read path

```ts
// on branch B
where: { _branch: { in: [B, 'main'] } }, limit: 2
// then prefer the row whose _branch === B
```

One round trip, at most two rows. On `main` it stays `{ _branch: { equals: 'main' } }` with `limit: 1`
— unchanged from today.

### Schema

Inject `_branch` (text, NOT NULL, default `'main'`, indexed) into each global's table, and into each
global's version collection.

Two fields collections need that globals do **not**:

- **No `_branchDocID`.** A global's identity is its slug, which is stable across branches. The entire
  `where`-tree ID-rewriting problem in §6 simply doesn't exist for globals.
- **No `_branchOp`.** Globals cannot be created or deleted through the API, only updated. There are no
  tombstones and no branch-created globals, which also means the cascade hazard in §16 never applies.

### Write path

`updateGlobal` on branch B targets the row `{ globalType: slug, _branch: B }`. If that row doesn't
exist, fork it — copy main's row with `_branch = B` — then apply the update. Same copy-on-write as
collections, minus the identity bookkeeping.

**One must-fix:** Mongo's `updateGlobal` currently runs
`findOneAndUpdate({ globalType: globalSlug }, data)` (`packages/db-mongodb/src/updateGlobal.ts:44`)
with no branch scoping. Left unchanged, editing a global while on a branch would write straight to
production. The Drizzle path needs the same treatment.

### The one real complication: `latest` on global versions

§7 argues that collection versions need no change to `latest`, because `latest` is scoped by `parent`
and a shadow row is its own parent. `packages/drizzle/src/createVersion.ts:78-80` confirms it — the
clearing statement is `SET latest = false ... AND parent = <parent>`.

**Global versions have no `parent` to scope by, and their clearing statement has no scope at all:**

- `packages/drizzle/src/createGlobalVersion.ts:62` — `SET latest = false` with no qualifying condition
  beyond the global's own table.
- `packages/db-mongodb/src/createGlobalVersion.ts:54-70` — `updateMany({ _id: { $ne: newDoc } , latest: true }, { $unset: { latest: 1 } })`.

So saving a draft of a global on a branch would clear **main's** `latest` flag, corrupting production
draft state without touching production content — the kind of failure that is invisible until someone
opens the global on main and finds their draft gone.

The fix is small and localized: add `_branch` to the global version schema and to the latest-clearing
predicate in both adapters. Because it silently damages main rather than the branch, it belongs in
phase 1 next to the read path, not in a later hardening pass, and it needs a dedicated test (test 27).

### Changeset registry

`payload-branch-changes` needs to reference globals, which have no document ID. Add:

| Field        | Change                                       |
| ------------ | -------------------------------------------- |
| `entityType` | new — `'collection'` \| `'global'`           |
| `globalSlug` | new — text, nullable; populated for globals  |
| `doc`        | now nullable; populated for collections only |

The unique compound `(branch, collectionSlug, doc)` covers collections. It cannot be extended to
globals by adding `globalSlug`, because `doc` is `NULL` for global rows and Postgres treats `NULL`s as
distinct in unique indexes — the same trap that drove the `'main'` sentinel decision in §3. Two
registry rows for the same branch and global would not collide.

Globals are few and there is exactly one write path, so enforce global uniqueness with an upsert on
`(branch, globalSlug)` in application code rather than contorting the index. Worth a comment in the
schema so the asymmetry doesn't read as an oversight.

### Merge

Globals collapse to two effective operations — `update` and `publish`. No `create`, no `delete`, and
therefore none of the branch-created special-casing from §16. Merge always goes through the Local API:

```ts
payload.updateGlobal({ slug, data: shadowData, req /* branch bypass → 'main' */ })
```

All hooks run, consistent with §14. Two edge cases:

- **A global never saved on main.** The branch's row is the first content that global has ever had.
  Merge is still `updateGlobal`, which Payload routes through `createGlobal` internally.
- **Published state plus a newer draft**, same as collections (§7): publish first, then apply the draft
  as a second write.

### Access

Globals have their own `access: { read, update }` and their own permissions operation
(`packages/payload/src/globals/operations/docAccess.ts:20`), so the §13.3 preflight extends to them
directly — group by `(globalSlug, effectiveOperation)` and evaluate. Because a branch can hold at most
one change per global, the tier-2 `Where` resolution never applies; globals always resolve in tier 1.

### Cost summary

| Concern                 | Collections                              | Globals                                 |
| ----------------------- | ---------------------------------------- | --------------------------------------- |
| Read predicate          | full §3 predicate + shadowed-ID manifest | `_branch IN (B, 'main')`, prefer branch |
| Identity rewriting (§6) | required                                 | not needed                              |
| Tombstones              | required                                 | not applicable                          |
| `latest` bookkeeping    | no change needed                         | **must be branch-scoped**               |
| Merge cases             | create / update / publish / delete       | update / publish                        |
| Cascade hazard (§16)    | applies                                  | not applicable                          |

---

## 9. Enablement, exclusions, and migrations

### Config

```ts
export default buildConfig({
  branching: true, // off by default; `true` enables every eligible collection
})
```

Per-collection opt-out, mirroring how `trash` and `versions` sit on the collection:

```ts
export const Settings: CollectionConfig = {
  slug: 'settings',
  branching: false,
}
```

Expanded form:

```ts
branching: {
  exclude: ['settings', 'audit-log'],
  maxShadowedIDs: 2000,
  access: { /* §14 */ },
  hooks: { /* §15 */ },
}
```

### Exclusions

**Built-in Payload collections — off by default, overridable.**

| Slug                       | Why it's off by default                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `payload-preferences`      | per-user UI state; branching it is meaningless                    |
| `payload-migrations`       | schema bookkeeping                                                |
| `payload-locked-documents` | ephemeral edit locks                                              |
| `payload-jobs`             | queue state; a branched job would execute or vanish unpredictably |
| `payload-query-presets`    | saved queries, not content                                        |

These are defaults, not blocks — `branching: true` on any of them opts in.

**One hard block: `payload-branches` and `payload-branch-changes`.** Not a policy choice; it's circular.
Branching the tables that store branch state means the registry would itself be branch-filtered, so
resolving "which documents are shadowed on branch B" would require already knowing the active branch in
order to read the registry that answers that question. These throw a config error on opt-in.

There is no canonical list of core-owned slugs in the codebase today — each is defined next to its own
config. This work should introduce one (`corePayloadCollectionSlugs`), useful beyond branching.

**Auth-enabled collections — off by default, overridable.**

```ts
export const Authors: CollectionConfig = {
  slug: 'authors',
  auth: true,
  branching: true, // deliberate opt-in
}
```

Detection is by the `auth` flag, never by slug. There is no reliable "users collection" to look for: the
auth collection can be named anything, a project can have several, and plugins can add their own. `auth`
may be `true` or an options object, and `disableLocalStrategy` collections (API-key or third-party auth)
still count — so the test is plain truthiness, matching what core already does at
`packages/payload/src/config/sanitize.ts:62`:

```ts
const authCollectionSlugs = config.collections.filter((c) => Boolean(c.auth)).map((c) => c.slug)
```

**Where this must run.** The branchable set is computed at the `sanitizeConfig` level, not inside
per-collection sanitization, and it is order-sensitive in both directions:

- **After** the default-user-collection injection (`sanitize.ts:62-72`), or an auto-created `users`
  collection is missed.
- **Before** the `sanitizeCollection` loop (`sanitize.ts:399-420`), because that loop performs `_branch`
  field injection and unique-index rewriting and needs the resolved set.
- Plugins have already run by then — `buildConfig` executes them before `sanitizeConfig`
  (`packages/payload/src/config/build.ts:15,32`) — so plugin-added auth collections are included.

`getLockedDocumentsCollection` is the precedent for this exact shape: it filters
`config.collections.filter((c) => c.auth)` off the raw config during `sanitizeConfig`
(`packages/payload/src/locked-documents/config.ts:18-20`).

**Why auth defaults to off.** A branched auth collection means a branch can contain a modified user —
different roles, different tenant, different password. If identity resolved through the branch, a user
could grant themselves elevated access simply by proposing it on a branch, with no merge required. It is
a default rather than a hard block because there are legitimate uses, such as an `authors` collection
that has login enabled but is really content.

**Mandatory safeguard:** `req.user` always resolves from `main`, regardless of the active branch, even
when the auth collection is branched. A branched user document can be viewed and edited like any other
content, but the identity used to authenticate and authorize is always main's version until merge.

**Derived and index collections** from plugins (`plugin-search`'s `search`, form submissions) should be
excluded by the project, since they are regenerated rather than authored. Worth documenting as guidance;
auto-detecting them is not reliable.

### Migrations

**On MongoDB: nothing.** Schemaless; new fields appear on write.

**On Postgres and SQLite: enabling branching requires one migration, and there is no way around it.**
This follows directly from §2 — branch state must be filtered at the database level for pagination to be
correct, which means it must be _in the table_, which means columns. Alternatives that appear to avoid
this (a side table plus a UNION view, table inheritance, JSON overlay columns) either reintroduce the
union or fail on one of the two adapter families.

What the migration is, and why it's mild:

- **Purely additive per included collection:** `_branch` (NOT NULL, `DEFAULT 'main'`), `_branchDocID`
  (nullable), `_branchOp` (nullable), plus indexes. Adding a `NOT NULL` column with a constant default is
  a metadata-only operation on PG11+ — no table rewrite.
- **One non-additive piece:** each `unique: true` field's index is dropped and recreated as
  `(field, _branch)`. Generated automatically by `payload migrate:create`. On large tables the create
  should be run `CONCURRENTLY` — worth documenting rather than automating.
- **No data backfill.** Existing rows take `'main'` from the column default and `NULL` for the rest.
- **Nothing on 3.x → 4.x.** Branching is off by default, so the upgrade adds no migration.
- **Turning branching off requires no migration.** Predicates stop being applied and the columns go
  inert. Re-enabling is free. A cleanup migration to drop them is optional and can come much later.

Because branching defaults to every eligible collection, that first migration touches every content
table at once. That is the main operational cost of opt-out-by-default and should be stated plainly in
the docs.

---

## 10. Schema reference

### `payload-branches` (internal collection)

| Field                  | Type                  | Notes                                                          |
| ---------------------- | --------------------- | -------------------------------------------------------------- |
| `name`                 | text                  | display name                                                   |
| `slug`                 | text, unique, indexed | branch identifier; **immutable after create**; `main` reserved |
| `status`               | select                | `open` \| `merging` \| `merged` \| `closed`                    |
| `createdBy`            | relationship → users  |                                                                |
| `mergedAt`, `mergedBy` | date, relationship    |                                                                |

`slug` is immutable because `_branch` stores the slug rather than a foreign key — an equality on an
indexed text column on the hottest read path, with no join and no slug→id resolution for main reads.

### `payload-branch-changes` (changeset registry)

Powers the manifest, the changed-documents UI, the access preflight, and merge. Holds no document
content; content lives in the shadow row.

| Field            | Type                                                   | Notes                                                                      |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `branch`         | relationship → payload-branches, indexed               |                                                                            |
| `collectionSlug` | text, indexed                                          | denormalized from `doc.relationTo` for cheap grouping                      |
| `doc`            | **polymorphic relationship → all branchable**, indexed | canonical document; per-collection ID typing handled by Payload            |
| `rowID`          | text                                                   | shadow row PK; derivable, stored as an optimization                        |
| `operation`      | select                                                 | `create` \| `update` \| `delete`                                           |
| `baseUpdatedAt`  | date                                                   | main's `updatedAt` at fork — powers the "main moved" warning (§16)         |
| `baseVersionID`  | text                                                   | main's `latest` version at fork; enables the since-you-branched diff (§16) |
| `changedBy`      | relationship → users                                   | author, as distinct from merger                                            |

Compound index on `(branch, collectionSlug)`; unique compound on `(branch, collectionSlug, doc)` — one
change per document per branch, which eliminates a class of ambiguity at merge time and is why no
`refresh` operation is needed (§17).

### Injected fields

| Collection             | Field           | Type                                                   |
| ---------------------- | --------------- | ------------------------------------------------------ |
| branch-enabled         | `_branch`       | text, NOT NULL, default `'main'`, indexed              |
|                        | `_branchDocID`  | **`relationship`, `relationTo: <own slug>`**, indexed  |
|                        | `_branchOp`     | text                                                   |
| its version collection | `_branch`       | text, NOT NULL, default `'main'`, indexed              |
|                        | `_branchParent` | **`relationship`, `relationTo: <base slug>`**, indexed |

All `admin.hidden: true`.

**`_branchDocID` must not be a text field.** A collection's ID type is configurable — `text` or `number`
by adapter default, or whatever a custom `id` field declares (`customIDType`) — so a hardcoded text
column would break numeric-ID collections and make the §6 rewrite compare mismatched types. Declaring it
a self-referential `relationship` makes Payload resolve the ID type per adapter, exactly as
`buildVersionCollectionFields` does for `parent`
(`packages/payload/src/versions/buildCollectionFields.ts:14`); `plugin-nested-docs` proves the
self-referential case (`packages/plugin-nested-docs/src/fields/parent.ts:18`). It also provides the
null-safe `not_in` behavior described in §5.

### Why the registry's `doc` is polymorphic

`payload-branch-changes` spans collections with different ID types — auto-increment integers, custom
text IDs, ObjectIDs — so the canonical document reference cannot be a single typed relationship.

A polymorphic relationship matches how `payload-locked-documents` stores its `document` field
(`packages/payload/src/locked-documents/config.ts:41`). Payload handles the per-collection ID typing
itself, creating a correctly-typed column per target collection in the `_rels` table on relational
adapters.

The rejected alternative was flat text plus manual coercion to
`collection.customIDType ?? payload.db.defaultIDType`. It is faster, but it **fails open**: a bad
string→number conversion does not error, it matches nothing, and "matches nothing" in the shadowed-row
predicate means main's copy of a document silently appears on the branch alongside the branch's copy.
Silent wrongness in the most correctness-critical predicate in the feature is not worth the saved join,
especially since the manifest loads once per request rather than per collection.

---

## 11. Where the predicate is applied

Two candidate layers:

**Operations layer** (`find.ts`, `findByID.ts`, …), mirroring `appendNonTrashedFilter`. Explicit and
greppable, matching an existing pattern — but roughly 15 call sites, and any internal `payload.db.find`
that bypasses an operation leaks unbranched data.

**Adapter layer — chosen.** Each adapter's `find` / `findOne` / `count` / `findDistinct` / `queryDrafts`
/ `findVersions` calls one shared helper exported from `payload`. Nothing can bypass it, and since the
adapters are being modified for `joins` anyway, branch logic stays in one layer rather than two.

Both need an explicit escape hatch, because some reads must _not_ be branch-filtered: reading
`payload-branches` itself, the merge engine reading shadow rows, and diff views reading two branches in
one request. Add `branch?: false | string` to the db method args, defaulting to `req.branch`, with
`false` bypassing.

A dev-mode assertion that every db read on a branchable collection either applied the predicate or
explicitly opted out would catch the leak class cheaply.

### Performance and compatibility acceptance criteria

- **Zero measurable cost when branching is off.** No predicate construction, no manifest query, no extra
  allocation — a `branching`-disabled config must take today's code path. Guard at the top of the helper
  and return `where` unmodified. Test 11 asserts query shapes are unchanged; add a benchmark under
  `test/benchmark-*` comparing on and off.
- **One additional indexed predicate on `main`** when branching is on — `_branch = 'main'`, nothing more.
  The overwhelmingly common read must not pay for the branch machinery.
- **One manifest query per request**, not per collection or per operation. Loaded lazily on first branch
  read and memoized on `req`. A page rendering 12 collections issues one manifest query.
- **Every adapter uses the same helper**, not its own logic. The predicate builder and the `where`-tree
  ID rewrite live in `packages/payload` and are imported by `db-mongodb` and `drizzle`; adapters supply
  only the query translation they already do. Divergent per-adapter implementations are how Mongo and
  Postgres behavior drifts apart, which is what the three-database test matrix exists to catch.
- **Indexes must match the predicate shape**, not just the columns: `_branch` alone, and
  `(_branch, _branchDocID)` compound.
- **`db-d1-sqlite` and `db-vercel-postgres` inherit from `drizzle`** and must be covered by the same
  suite rather than assumed equivalent.

---

## 12. Write paths

**Create on branch B** — set `_branch = B`, `_branchOp = 'create'`, `_branchDocID = <own id>`; write a
registry row. Main is untouched.

**Update on branch B** — copy-on-write in `updateOne`: find the existing shadow row
`{ _branch: B, _branchDocID: id }` and update it; if absent, run the §7 fork procedure first. Because the
operation ends up targeting a real row, field hooks, validation, and version creation all run unmodified.

**Delete on branch B** — in `deleteOne` / `deleteMany`:

- Created on B → real delete plus registry cleanup; nothing is left behind.
- A main row → do not delete. Upsert a tombstone shadow row (`_branchOp = 'delete'`) and record
  `operation: 'delete'`. Return the main document as the deleted document so `afterDelete` hooks receive
  the right payload.

---

## 13. Access control

Three questions, and only the first needs anything new.

### 12.1 Who can create, see, and merge a branch?

`payload-branches` is a collection, so standard `access` covers create/read/update/delete — including
`Where`-returning read access for "editors only see their own branches".

**Merge permission is not a separate role gate.** Payload has no built-in concept of roles, only access
functions, so "who can merge" is derived from the access control already defined on the documents being
merged. A user can merge a branch precisely when they hold the production permission for every change in
it, evaluated through each collection's own `access` functions. No reviewer requirement is baked in; a
project that wants one expresses it in access control like anything else.

The per-document preflight in §13.3 **is** the permission model, not a second check layered on a role
check. The only branch-level access is ordinary collection access on `payload-branches`:

```ts
branching: {
  access: {
    createBranch: ({ req }) => Boolean(req.user),
    readBranch: ({ req }) => ({ createdBy: { equals: req.user?.id } }),
  },
}
```

An optional `merge` access function can exist as an _additional_ narrowing gate — freeze windows, "only
leads merge" — but it is not the mechanism and defaults to permissive.

### 12.2 Does being on a branch change document access?

Yes, with **no new primitive**. `req.branch` is in scope inside ordinary access functions:

```ts
access: {
  update: ({ req, data }) => {
    if (data?._status === 'published' && !req.branch) {
      return isAdmin(req)   // publishing is admin-only on main
    }
    return isEditor(req)    // ...but any editor can publish on a branch
  },
}
```

This works because of how Payload already models publishing. `getDocumentPermissions`
(`packages/ui/src/utilities/getDocumentPermissions.ts:52-65`) derives `hasPublishPermission` by calling
`docAccessOperation` with `data: { ..., _status: 'published' }` and reading `.update`. **Publish
permission is just `access.update` evaluated against published data.** So "blocked from publishing on
main, allowed on a branch" is a single conditional, and the Publish button in the admin UI lights up
correctly on the branch with no UI work.

A parallel `branchAccess` config block was considered and rejected: two places to express one idea, and
it cannot express "same rule, different threshold" as cleanly as a conditional.

### 12.3 Merge-time preflight

A branch is a proposal; nothing on it is real until merge. Deferring enforcement to that single point is
what makes permissive branch writes safe — so the preflight is the enforcement boundary.

For each change, resolve the effective operation (§7) and check it as the merging user. One
`docAccessOperation` per document is too slow for a large branch, so evaluation is two-tier:

1. **Group by `(collectionSlug, effectiveOperation)`** and evaluate the collection's access function once
   per group with representative data (`{ _status: 'published' }` for the publish group). `true` passes
   the group; `false` fails it in one call; a `Where` falls to tier 2.
2. **One query per unresolved group:**
   `find({ collection, where: { and: [accessWhere, { id: { in: docIDs } }] }, overrideAccess: true, pagination: false })`.
   Any ID not returned is denied.

The result must be descriptive enough to drive both the UI and a meaningful HTTP error, so it reports per
document and always names the collection, the document, the operation denied, and why:

```ts
type MergePreflight = {
  canMerge: boolean // true when at least one selected change is mergeable
  mergeable: Array<{ changeID; collectionSlug; docID; operation }>
  blocked: Array<{
    changeID: string
    collectionSlug: string
    docID: number | string
    docTitle: string // so the UI shows "Homepage", not an ID
    operation: 'create' | 'delete' | 'publish' | 'update'
    reason: 'access' | 'field-access' | 'unique-collision'
    deniedFields?: string[] // populated when reason is 'field-access'
    message: string // human-readable, ready to render
  }>
  warnings: Array<{
    changeID: string
    collectionSlug: string
    docID: number | string
    reason: 'dangling-reference' | 'main-moved'
    message: string
    relatedChangeIDs?: string[] // for dangling-reference: what to also select
  }>
}
```

Messages name the specific document rather than the collection — _"You don't have permission to publish
Pages → Homepage"_, not _"You don't have publish access to Pages."_ The collection-level summary is
something the UI derives by grouping; the API returns the detail.

`POST /branches/:id/merge` returns the same structure, responding `403` with `blocked` populated on a
fully blocked merge, so programmatic callers get exactly the reasons the admin UI shows. In the Local API
it is `payload.branches.merge({ branch, dryRun: true })`, so the UI can disable and explain the button
before anyone clicks it.

Because merge is selective (§16), `blocked` does not fail the whole merge — those documents become
unselectable while the rest proceed.

### 12.4 Validate with access, execute with `overrideAccess: true`

The preflight runs as the merging user; the merge itself runs unrestricted. Under
`overrideAccess: false`, **field-level** access would silently strip fields — a partial merge that looks
successful. Field-level denials belong in the preflight (`reason: 'field-access'`), using the `fields`
map `docAccessOperation` already returns.

---

## 14. Hooks

### Branch lifecycle

`payload-branches` is a collection, so CRUD hooks come free. The only new surface is merge:

```ts
branching: {
  hooks: {
    beforeMerge?: (args: { branch, changes, preflight, req }) => void | Promise<void>
    afterMerge?: (args: { branch, req, results }) => void | Promise<void>
  },
}
```

`beforeMerge` can throw to block — approval gates, freeze windows. `afterMerge` is where front-end
rebuilds and cache purges go; it receives every touched document grouped by collection, so one
revalidation call covers the whole merge instead of one per document.

### Document hooks on merge — all hooks run

**Every hook runs on merge, before and after.** The shadow row and the main row are _different rows_, so
merge is a genuine write to main. Skipping before-hooks would mean main's row receives data that never
passed through main's own write pipeline: derived fields not recomputed, invariants not enforced,
`updatedBy` not stamped. Most `beforeChange` hooks are pure data transforms and idempotent, so the
double-side-effect risk is smaller than the integrity risk.

Three consequences:

**1. Merge must not target the branch.** `payload.update({ collection, id: canonicalID })` executed while
`req.branch` is still set would copy-on-write fork the document onto the branch again instead of writing
to main. Merge runs with the §11 escape hatch set to `branch: false` — a full bypass rather than
`branch: 'main'`, since it must reach shadow rows by their real primary key. This needs an explicit test;
it is the kind of bug that silently produces a no-op merge.

**2. Branch-created documents must not go through `payload.create()`.** The shadow row already holds the
ID that inbound relationships point at, so recreating it means deleting it first — and Payload's
relational schema cascades `_rels` deletions (`packages/drizzle/src/schema/build.ts:648-658`), which
would destroy every existing relationship to that document. They merge as an update in place of the
shadow row instead, through the same pipeline as every other case (§16). This also sidesteps
`allowIDOnCreate`, an adapter option defaulting to false (`packages/db-mongodb/src/index.ts:250`) that
would otherwise need a core workaround.

**3. `context.isMerge` for non-idempotent hooks.** Hooks with genuine side effects (incrementing a
counter, posting to an external system) need an opt-out. Every hook receives
`context: { isMerge: true, branch, changedBy }`. `req.user` is the **merger**, so `updatedBy`-style
stamping records who merged; `context.changedBy` carries the original author.

Re-running validation will _not_ catch dangling relationships. Payload's relationship validation checks
ID **format** via `isValidID`, not existence (`packages/payload/src/fields/validations.ts:920-948`). This
matters for selective merge — see §16.

**Transaction boundary.** Per-document hooks fire inside the merge transaction, matching normal Payload
behavior, so a failing hook rolls the merge back. `afterMerge` — the hook most likely to call an external
deploy webhook — fires **after commit**, with errors collected into the result. A flaky rebuild endpoint
must not undo a merge.

---

## 15. Branch resolution across APIs

Resolved once per request into `req.branch`, a first-class typed property alongside `req.locale`.
Precedence, highest first:

1. **Explicit operation argument** — `payload.find({ collection, branch: 'halloween' })`, typed on every
   Local API operation. Also the escape hatch for cross-branch reads.
2. **`branch` query param** — parsed in `parseParams`, alongside `draft` and `trash`.
3. **`X-Payload-Branch` header** — programmatic REST and GraphQL clients.
4. **`payload-branch` cookie** — how the admin UI persists the switch, same as auth.
5. **Default `main`.**

GraphQL gets a `branch` argument on generated queries in
`packages/graphql/src/schema/initCollections.ts`, next to the existing `draft` and `trash` args.

**Two things must be branch-aware or they will silently serve wrong data:**

- **The dataloader cache key.** `createDataloaderCacheKey` includes `transactionID`, `locale`, `depth`,
  and `overrideAccess`, but not branch. Cross-branch reads in one request would collide.
- **Next.js and fetch caching.** Any response cache keyed only on URL serves one branch's content to
  another. Branch must be part of the cache key, and admin requests on a branch should be `no-store`.

**Read access gates resolution.** Requesting a branch the user cannot `read` (§13.1) must error rather
than silently falling back to `main` — production content under a branch indicator is worse than an
error.

---

## 16. Merge

**Branch data always wins.** No field-level merge, no three-way resolution, no blocking conflict state. A
merged change is a flat overwrite of main with the branch's document.

What replaces conflict resolution is **selection**. The merge UI lists every changed document and the
user picks which to accept. Unselected changes stay on the branch, which stays open.

```ts
payload.branches.merge({
  branch: 'halloween',
  changes: [changeID, ...], // omit to merge everything selectable
  dryRun: false,
})
```

`baseUpdatedAt` powers a **warning** rather than a block: "main has changed since this document was
branched" (`warnings[].reason: 'main-moved'`). Nothing is refused on that basis.

A companion operation ships alongside: **discard a change** — drop the shadow row and its registry entry,
reverting that document on the branch to main's current state.

```
merge(branch, { changes, dryRun }) →
   1. preflight the selected changes (§13.3)      → blocked[] marked unselectable
   2. compute warnings (main-moved, dangling-reference)
   3. if dryRun → return { canMerge, blocked, warnings }
   4. beforeMerge hook                            → may throw
   5. begin transaction; set req.branch bypass → 'main'
   6. per selected change, dependency-ordered: apply
   7. delete merged registry rows and shadow rows; if none remain, mark branch merged
   8. commit
   9. afterMerge hook (outside the transaction)
```

### There is no merge-ordering constraint

A natural worry: a page created on a branch references media uploaded on the branch; merge the page
first and it points at a media ID that isn't on main yet, so the write fails.

**That failure cannot happen, because the media row already exists.** A document created on a branch is
not held in a pending buffer — it is a real row in the `media` table from the moment it is created,
carrying `_branch = 'halloween'`. The page's foreign key points at that row and is satisfied
continuously, before and after merge. Merging the page without the media violates nothing at the
database level, and does not fail validation either, since relationship validation checks ID format
rather than existence (`packages/payload/src/fields/validations.ts:920-948`).

What remains is softer: main's page references a row that main's read predicate hides, so the
relationship reads as empty on main. That is the `dangling-reference` warning below, not a merge failure
— which makes dependency ordering a nicety rather than a correctness requirement.

### One pipeline, three callers

The constraint here is narrower than it first appears. It is not "avoid the operations layer" — it is
**never delete and recreate a row**.

Replaying a branch-**created** document through `payload.create()` would require deleting the shadow row
and rebuilding it with the same ID. Payload's relational schema puts a foreign key on
`_rels.<target>_id → <target>.id` with **`onDelete: 'cascade'`**
(`packages/drizzle/src/schema/build.ts:648-658`), so deleting shadow row `media[999]` cascade-deletes
every `_rels` row pointing at it — rows belonging to _other_ documents. Merging a branch-created image
that way would silently sever every reference to it, and rebuilding the row does not restore them.

But a branch-created document does not need to be _created_ on main at all. It is already a row holding
the right ID and the right data; merging it is an **update in place** that flips `_branch` from the
branch to `'main'`. So `payload.create()` is what's excluded — not the operations layer.

That collapses the two mechanisms into one. All three cases route through the same pipeline, differing
only in which row they target and how the hook is labelled:

| Case                  | Target row    | Data                            | Hook `operation` |
| --------------------- | ------------- | ------------------------------- | ---------------- |
| **created on branch** | shadow row PK | shadow data + `_branch: 'main'` | `create`         |
| **update / publish**  | main row PK   | shadow data                     | `update`         |
| **delete**            | main row PK   | — (`payload.delete`)            | `delete`         |

**Where the sharing happens.** Payload already factors the collection write pipeline into
`updateDocument` (`packages/payload/src/collections/operations/utilities/update.ts`), whose JSDoc
enumerates the hook order it guarantees, and which is called by both `update.ts:257` and
`updateByID.ts:202`. Merge becomes a **third caller of that same utility** rather than a parallel
implementation, which is exactly the factoring the codebase already uses for this problem.

**What core has to add.** `operation` is hardcoded to `'update'` in eight places inside `updateDocument`.
Thread it as a parameter. That is the entire new surface — no duplicated pipeline, and nothing for the
two paths to drift apart on, because there is one path.

Four implementation details this depends on:

- **Merge runs with `branch: false`, a full bypass — not `branch: 'main'`.** It must reach the shadow row
  by its real primary key, and a `_branch = 'main'` predicate would hide exactly the row it needs.
- **`originalDoc` for the create case.** Targeting the shadow row means before-hooks would see
  `originalDoc` equal to the incoming data, so a hook that diffs the two sees no change even though main
  is gaining a document. Pass no prior document for merge-creates so hooks observe a genuine create.
- **Version rows follow the document.** The shadow row's versions still carry `_branch = <branch>`; flip
  them to `'main'` alongside. One extra statement, not a second mechanism.
- **`_branch` must be internally writable.** It is `admin.hidden` but a real field; merge sets it through
  `data` with `overrideAccess: true`.

By draft state:

- **update (draft only)** → `payload.update({ collection, id: canonicalID, data, draft: true, req })`.
  Main's published row stays untouched, matching Payload's own draft-save behavior.
- **publish** → `payload.update({ collection, id: canonicalID, data: { ...data, _status: 'published' }, req })`.
- **published + newer draft** → both in sequence: publish the branch's published state, then apply the
  newer draft as a second `draft: true` update.

### Two failure modes surfaced in the preflight

**Unique collisions.** Two branches can each hold `slug: 'about'` because the unique index is
branch-scoped; merging the second violates main's constraint. "Branch wins" cannot resolve it — both
sides are branch data. Detected in preflight and reported as `blocked`.

**Dangling references from selective merge.** Document A references document B, both created on the
branch, only A selected. Main's A now points at a row hidden from main. Nothing errors — population falls
back to returning the raw ID. Two mitigations:

1. **Dependency ordering** — sort selected changes so referenced documents merge first. Handles the
   common case silently.
2. **A `dangling-reference` warning** naming the unselected changes a selected change depends on, so the
   UI can offer "also select these".

**Discard carries the same cascade hazard, and warns.** Discarding a branch-created document deletes its
row, which cascade-deletes inbound `_rels` rows — including from _main_ documents, if a main document was
updated on the branch to reference it. Discard checks for inbound references and returns a
`broken-reference` warning naming the affected main documents, but does not refuse: consistent with
`main-moved` and `dangling-reference`, the user is informed and stays in control. The admin UI surfaces
the warning as an explicit confirmation step rather than a silent proceed.

---

## 17. What "staleness" does and doesn't require

Selective merge means a branch can outlive its own merges: merge 3 of 10 changes and 7 remain while main
moves on. Those 7 shadow rows hold documents forked from main's older state. This does not require a
`refresh` or rebase operation, for a reason worth stating explicitly since it comes up immediately.

When staleness actually matters:

1. **The remaining changes touch different documents than anything that changed on main.** No problem.
   Each shadow row is a complete document; merging it overwrites main's copy of _that_ document, which
   nobody else touched. Staleness only matters where two edits overlap.
2. **A remaining change touches a document that also changed on main.** This is the `main-moved` case.
   "Branch wins" discards main's edit — the intended semantic, with a warning to make it visible first.
3. **Main changed in a way the branch author would have wanted to keep.** Mechanically the same as 2, but
   the author wants to act on it.

Only case 3 has unmet need, and a `refresh` operation cannot serve it:

- _Re-fork from main, keeping branch edits_ is a three-way merge — main's current state, the fork-point
  state, and the branch state, reconciled per field. That is exactly the field-level conflict resolution
  this design excludes.
- _Re-fork from main, discarding branch edits_ is `discard`, which already exists.

There is no third possibility, so no `refresh` ships. What ships instead is making case 3 actionable:

- The registry stores `baseVersionID` — main's `latest` version at fork time.
- For versioned collections that yields a free before/after: diff main's version at fork against main's
  current version and render "these 4 fields changed on main since you branched this document."
- The author then chooses among options that already exist: merge anyway, discard and redo, or hand-copy
  main's change into the branch document and merge.
- Unversioned collections degrade to "main has changed" without detail.

Two cheap adjacent measures:

- The registry's unique `(branch, collection, doc)` constraint already prevents conflicting changes from
  accumulating per document.
- **Surface branch age and staleness count in the branch list** — "Opened 6 weeks ago · 7 changes · 3
  where main has moved". Long-lived branches are the root cause, and visibility addresses it better than
  machinery. A team that wants enforcement can throw from `beforeMerge`.

---

## 18. Known limitations for v1

- **Uploads** — a file created on a branch is written to storage immediately, and a file "deleted" on a
  branch must survive until merge. v1: never delete the binary on branch delete; garbage-collect on merge.
- **Auth collections** — off by default, opt-in available (§9). `req.user` always resolves from `main`.
- **Branch-from-branch and rebase** — not in v1.
- **Scheduled publish** — `versions/schedule/job.ts` operates on main; scheduling from a branch is
  undefined and should be rejected in v1.
- **`unique` semantics change** (§9) and the enable-time migration.

`joins` and globals are deliberately not on this list. `joins` are in scope as phase 3 and are the reason
this is core work; globals are in scope from phase 1 (§8).

---

## 19. Delivery phases

**Phase 0 — spike.** Confirm the load-bearing assumptions with throwaway tests: (a) the anti-join hazard
in §5(a) is real; (b) the §3 predicate yields correct `totalDocs` on Mongo, Postgres, and SQLite; (c)
`latest` needs no change for _collection_ versions, verified against real `queryDrafts` output; (d) a
compound `(field, _branch)` unique index with the `'main'` sentinel enforces main-side uniqueness on all
three; (e) the unscoped `latest` clearing in `createGlobalVersion` does in fact clobber main's flag from a
branch (§8), confirming the fix is needed rather than assumed. Any of these can invalidate part of the
design; all are cheap.

**Phase 1 — schema and read path, including drafts.** `branching` config, exclusion resolution, field
injection, unique-index rewriting, `payload-branches` and `payload-branch-changes`, `req.branch`
resolution across all three APIs, the shared predicate helper in the adapters, the `where`-tree ID
rewrite, and `queryDrafts`. **Globals**: `_branch` injection on global and global-version tables, the
two-row read with branch preference, and the branch-scoped `latest` fix in both adapters'
`createGlobalVersion` — the last of these lands here rather than later because it silently corrupts main.
Creates on a branch work; updates and deletes are rejected.

**Phase 2 — write path.** Copy-on-write updates with the fork procedure, tombstone deletes, `updateMany`
and `deleteMany`, publish-on-branch, registry maintenance. **Globals**: branch-scoped `updateGlobal` in
both adapters, global forking, and the `entityType` / `globalSlug` registry fields.

**Phase 3 — branch-aware joins.** `buildJoinAggregation` and `resolveJoins` in `db-mongodb`, join
subqueries in `drizzle`.

**Phase 4 — access.** `req.branch` in access functions, the two-tier preflight, `dryRun`.

**Phase 5 — merge.** Transactional apply, selective merge, discard, document hooks, branch hooks,
unique-collision detection, dependency ordering. Globals merge through `updateGlobal` with no
special-casing.

**Phase 6 — UI.** Branch switcher in the app header, branch list, changed-documents view with
per-document selection (globals appear in the same list), merge flow surfacing `blocked` and `warnings`,
persistent branch indicator.

**Later** — branch-from-branch, field-level diff.

---

## 20. Test matrix

`test/branching/`, standard layout. Must run green on `pnpm test:int branching`, `test:int:postgres`, and
`test:int:sqlite` — Mongo/Drizzle divergence is where this design is most likely to break.

Collections: `posts` (plain), `pages` (drafts + versions), `media` (upload), `categories` (relationship
and join target), one with a `unique` field, one with `Where`-returning access, one with a **custom text
ID**, one with a **numeric/autoincrement ID**, and one **excluded** via `branching: false`.

### Core model

| #   | Behavior                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Document created on a branch is absent from `main`, present on the branch                                                                            |
| 2   | **Pagination integrity** — 25 on main, 5 created on branch, `limit: 10`: main `totalDocs: 25`/3 pages, branch `30`/3 pages, no document on two pages |
| 3   | Document deleted on a branch is absent there, present on main and on a second branch                                                                 |
| 4   | **Filtering on a branch-modified field** — the §2 case                                                                                               |
| 5   | **Sorting on a branch-modified field** orders by branch values                                                                                       |
| 6   | `findByID` with the canonical ID returns branch content on the branch, main content on main                                                          |
| 7   | `count`, `findDistinct`, and `group-by` agree with `find`                                                                                            |
| 8   | Relationship population resolves to the branch's version of the related document                                                                     |
| 9   | Two concurrent branches don't see each other's changes                                                                                               |
| 10  | Local API argument, query param, header, and cookie resolve identically                                                                              |
| 11  | **Regression: `branching` off ⇒ no columns injected, no predicate appended, query shapes unchanged**                                                 |
| 12  | A collection with `branching: false` is unaffected while others branch                                                                               |
| 13  | Built-in collections are off by default but opt-in-able; `payload-branches` / `payload-branch-changes` reject opt-in with a config error             |
| 13a | An `auth: true` collection is **not** branched by default — even when named something other than `users`, and even with `disableLocalStrategy`       |
| 13b | A project with **multiple** auth collections excludes all of them; a plugin-added auth collection is excluded too                                    |
| 13c | `auth: true` + `branching: true` opts in, and `req.user` still resolves from `main` while on a branch                                                |
| 14  | Full lifecycle on a **numeric-ID** and a **custom-text-ID** collection (`_branchDocID` typing)                                                       |
| 15  | Main rows with `_branchDocID = null` survive the `not_in` predicate on Postgres and SQLite (the NULL trap in §5)                                     |
| 16  | Compound `(field, _branch)` unique index still enforces uniqueness among main rows                                                                   |

### Joins

| #   | Behavior                                                             |
| --- | -------------------------------------------------------------------- |
| 17  | Join field on a branch includes documents created on that branch     |
| 18  | Join field on a branch excludes documents deleted on that branch     |
| 19  | Join field reflects branch-modified values in its `where` and `sort` |
| 20  | Join results on `main` are identical with branching on vs. off       |

### Globals

| #   | Behavior                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 21  | Editing a global on a branch leaves main's global untouched                                                                            |
| 22  | `findGlobal` on a branch returns the branch's version; on main, main's                                                                 |
| 23  | A global never edited on a branch reads through to main's row                                                                          |
| 24  | Publishing a global on a branch does not publish it on main                                                                            |
| 25  | Two branches hold independent versions of the same global                                                                              |
| 26  | Global draft saved on a branch is invisible to main `findGlobal({ draft: true })`                                                      |
| 27  | **Saving a global draft on a branch does not clear main's `latest` version flag** (the unscoped clearing in `createGlobalVersion`, §8) |
| 28  | Merging a global change applies it to main and fires the global's `afterChange` hooks                                                  |

### Drafts

| #   | Behavior                                                                                 |
| --- | ---------------------------------------------------------------------------------------- |
| 29  | Draft saved on a branch is invisible to main `find({ draft: true })`                     |
| 30  | Publishing on a branch does not publish on main                                          |
| 31  | `find({ draft: true })` returns the branch draft on the branch, main's draft on main     |
| 32  | Version history is isolated per branch; main's history is unmodified after a branch edit |
| 33  | Autosave on a branch writes only to the branch's version chain                           |
| 34  | Fork copies main's `latest` version, not just the published row                          |

### Access

| #   | Behavior                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------- |
| 35  | Publish denied on main is allowed on a branch (the §13.2 config)                                                    |
| 36  | Preflight marks documents unselectable when the merger lacks publish access, with the right shape                   |
| 37  | Preflight passes when only draft-level changes exist                                                                |
| 38  | `Where`-returning update access is resolved in tier 2, denying only non-matching documents                          |
| 39  | `dryRun` returns `blocked` and `warnings` without mutating anything                                                 |
| 40  | Requesting an unreadable branch errors rather than falling back to main                                             |
| 41  | Merge executes with `overrideAccess: true` — no field silently stripped                                             |
| 42  | `blocked` entries name the document (`docTitle`), operation, and reason; `/merge` returns 403 with the same payload |

### Merge and hooks

| #   | Behavior                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 43  | **Selective merge** — merging 2 of 5 changes applies exactly those; the other 3 remain on the open branch                                                  |
| 44  | Branch data flatly overwrites main even when main changed after the fork                                                                                   |
| 45  | `main-moved` warning is reported for that document without blocking                                                                                        |
| 46  | `main-moved` includes a field-level diff of what changed on main since the fork, for versioned collections                                                 |
| 47  | Discard reverts a document on the branch to main's state                                                                                                   |
| 48  | Discarding a branch-created document that a main document references returns a `broken-reference` warning naming the affected main documents, and proceeds |
| 49  | `afterChange` fires with `operation: 'create'` for branch-created documents                                                                                |
| 50  | `afterChange` fires with `operation: 'update'` and correct `previousDoc` for merged edits                                                                  |
| 51  | `afterDelete` fires for merged deletes                                                                                                                     |
| 52  | `beforeValidate` / `beforeChange` **do** re-fire on merge, with `originalDoc` = main's pre-merge state                                                     |
| 52a | For a merge-**create**, hooks observe a genuine create — no prior document — rather than a no-op diff against the shadow row                               |
| 53  | A `beforeChange` that derives a field recomputes it on merge; main never receives un-hooked data                                                           |
| 54  | Validation runs on merge — a document invalid against main's config is rejected with a field-level error                                                   |
| 55  | `context.isMerge` / `context.branch` / `context.changedBy` populated; `req.user` is the merger                                                             |
| 56  | **Merge writes target `main`, not the branch** — no shadow row is created by the merge itself                                                              |
| 56a | Merge reaches the shadow row by real PK under `branch: false`; a `branch: 'main'` bypass would hide it and silently no-op                                  |
| 57  | Published + newer draft merges as two sequential writes; main ends with a published version and a newer draft above it                                     |
| 58  | `beforeMerge` throwing blocks the merge, leaving the branch untouched                                                                                      |
| 59  | `afterMerge` fires once after commit; a throwing `afterMerge` does not roll back                                                                           |
| 60  | Merge rolls back cleanly on mid-way failure                                                                                                                |
| 61  | Merged branch-created document keeps its ID; inbound relationships still resolve                                                                           |
| 62  | **Merging a branch-created document preserves inbound `_rels` rows** — a main document referencing it still resolves after merge (the cascade trap)        |
| 63  | Merging a page whose branch-created media is _not_ selected succeeds; the reference resolves once the media is merged later                                |
| 64  | Unique collision between two branches is surfaced as `blocked`, not a DB error                                                                             |
| 65  | Selective merge leaving a dependency unselected emits a `dangling-reference` warning naming the missing change                                             |
| 66  | Dependency ordering merges a referenced document before the document referencing it                                                                        |
| 67  | Merging a branch-created document re-points its version rows from `_branch = <branch>` to `'main'`                                                         |
| 68  | All three merge cases route through `updateDocument`; the `operation` label is `create` / `update` / `delete` respectively                                 |

---

## 21. Decisions already made

| Decision                                                         | Rationale                                                                                            | §    |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- |
| Core, not a plugin                                               | `joins` are resolved inside the adapters, unreachable from a plugin                                  | 4    |
| Copy-on-write rows in the same table                             | Only way to keep pagination, sorting, and `count` correct                                            | 2, 3 |
| `main` is a sentinel string, not `NULL`                          | Postgres treats `NULL`s as distinct in unique indexes                                                | 3    |
| Bounded `not_in` manifest, one query per request                 | Avoids the Drizzle anti-join hazard; branches are small                                              | 5    |
| `_branchDocID` as a self-referential relationship                | Inherits the collection's ID type; provides null-safe `not_in`                                       | 10   |
| Registry `doc` as a polymorphic relationship                     | Spans mixed ID types without a coercion step that fails open                                         | 10   |
| Predicate applied in the adapters                                | Nothing can bypass it; adapters are being changed for `joins` anyway                                 | 11   |
| Drafts in v1                                                     | `latest` needs no change for collections — a shadow row is its own parent                            | 7    |
| **Globals in v1**                                                | No pagination means the §2 constraint doesn't bind; a two-row read with branch preference is correct | 8    |
| **Global versions need branch-scoped `latest`**                  | Globals have no `parent` to scope by, and the clearing statement is currently unscoped               | 8    |
| Opt-out by default; built-ins and auth off but overridable       | Turn-key adoption, with the dangerous defaults inverted                                              | 9    |
| Auth detected by the `auth` flag during `sanitizeConfig`         | The auth collection can be named anything; several can exist                                         | 9    |
| `req.user` always resolves from `main`                           | Otherwise a branch grants its own author elevated access                                             | 9    |
| Merge permission derived from per-document access control        | Payload has access functions, not roles                                                              | 13   |
| All document hooks re-run on merge                               | Merge is a genuine write to a different row; main must not receive un-hooked data                    | 14   |
| Branch wins; selection replaces conflict resolution              | Simplest semantic that covers the real workflow                                                      | 16   |
| Branch-created documents merge as an update in place             | `_rels` FKs cascade on delete; recreating would destroy inbound relationships                        | 16   |
| One merge pipeline — merge is a third caller of `updateDocument` | Avoids two mechanisms drifting apart; reuses the factoring core already has                          | 16   |
| Discard warns rather than refuses on broken references           | Consistent with every other risk signal in the design                                                | 16   |
| No `refresh` / rebase operation                                  | It is either three-way merge or a synonym for `discard`                                              | 17   |
| Merge is synchronous, transactional, and uncapped                | Predictable failure semantics; a cap can be added if real branches get large                         | 16   |

---

## 22. Open questions

**None outstanding.** Every question raised during design has been resolved and folded into the sections
above. The three most recently settled:

- **Merge uses one pipeline, not two.** The constraint was never "avoid the operations layer" — it was
  "never delete and recreate a row." A branch-created document merges as an update in place of the
  existing shadow row, so all three cases share `updateDocument`, the utility `update.ts` and
  `updateByID.ts` already share (§16).
- **Merge is uncapped.** No ceiling on changes per merge; revisit if real branches strain a transaction.
- **Discard warns rather than refuses** when a main document references the document being discarded,
  consistent with every other risk signal in the design (§16).

### Phase 0 spike results

The design rested on three claims inferred from reading the codebase. `test/branching/spike.int.spec.ts`
tests them, and **phase 0 is closed** — the spike runs green on all three adapters.

| #   | Claim                                                                                                        | Status                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `not_in` on a hasMany field is unusable for shadow tracking (§5a)                                            | **Confirmed on Postgres and SQLite, and worse than described** — two defects, not one; the empty-array exclusion was unpredicted. Mongo's `$nin` is correct on both counts, so a Mongo-only run would have missed it entirely. |
| 2   | A compound `(field, _branch)` unique index with the `'main'` sentinel enforces main-side uniqueness (§3, §9) | **Confirmed on all three**                                                                                                                                                                                                     |
| 3   | `latest` on collection versions is scoped per parent, so shadow rows need no version changes (§7)            | **Confirmed on all three**                                                                                                                                                                                                     |
| 4   | The unscoped `latest` clearing in `createGlobalVersion` clobbers main's flag from a branch (§8)              | **Still not testable** — cannot be expressed until globals carry `_branch`; covered by test 27                                                                                                                                 |

One prediction that did **not** hold: `_branchDocID` was expected to surface as an ObjectID on Mongo and
break canonical-ID projection. It does not — IDs are normalised before the projection runs, so the same
code path serves all three adapters.

--- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 1 | `not_in` on a hasMany field is unusable for shadow tracking (§5a) | **Confirmed, and worse than described** — two defects, not one; the empty-array exclusion was unpredicted |
| 2 | A compound `(field, _branch)` unique index with the `'main'` sentinel enforces main-side uniqueness (§3, §9) | **Confirmed** |
| 3 | `latest` on collection versions is scoped per parent, so shadow rows need no version changes (§7) | **Confirmed** |
| 4 | The unscoped `latest` clearing in `createGlobalVersion` clobbers main's flag from a branch (§8) | **Not yet testable** — cannot be expressed until `_branch` exists; covered by test 27 |

**Adapter coverage caveat.** The spike currently runs green on SQLite only. Postgres and Mongo require
Docker, which was unavailable in the environment where these were first run. Postgres shares the Drizzle
query builder with SQLite, so claims 1 and 2 carry over by strong inference but are not verified; Mongo
is expected to differ on claim 1 (`$nin` handles both cases correctly) and the spike asserts that
branch explicitly. **Running the spike on all three adapters is a prerequisite for closing phase 0.**
