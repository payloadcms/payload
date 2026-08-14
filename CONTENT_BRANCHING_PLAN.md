# Content Branching — Status

**Branch:** `feat/content-branching` · **Targets:** Payload 4.0

For what branching is, the API and the panel, see [`CONTENT_BRANCHING.md`](./CONTENT_BRANCHING.md). The
original design proposal, with the reasoning behind every decision below, is
[`CONTENT_BRANCHING_DESIGN.md`](./CONTENT_BRANCHING_DESIGN.md).

The loop works end to end on **MongoDB, Postgres and SQLite**: branch, edit in isolation, review what
changed, merge some or all of it back under the merging user's own permissions — or throw it away.

| Suite                          | Result                         |
| ------------------------------ | ------------------------------ |
| `test:int branching` (MongoDB) | 186 passed, 2 skipped, 5 todo  |
| `test:int:sqlite branching`    | 186 passed, 2 skipped, 5 todo  |
| `test:e2e branching`           | 37 passed                      |
| `branching:` translation keys  | 71, complete in all 43 locales |

---

## Implemented

### Core

- **Config surface.** `branching: true` or the object form (`exclude`, `access`, `hooks`). Auth collections
  and Payload's own bookkeeping collections (`payload-jobs`, `payload-preferences`,
  `payload-locked-documents`, `payload-migrations`, `payload-query-presets`, KV) are off by default and opt
  in individually. Uploads are branched like anything else.
- **Schema injection and unique-index rewriting.** `_branch`, `_branchDocID`, `_branchOp` on collections;
  `_branch`, `_branchParent` on version collections. Unique constraints become compound
  `(field, _branch)`.
- **Branch resolution** from a Local API argument or the `branch` query param, materialised onto
  `req.branch` at the HTTP boundary and memoized per request along with the change manifest. An explicit
  `branch` on an operation **wins** over what the request has already resolved — the same contract `locale`
  has. Because branch state is memoized per request, saying so is not enough: the operation runs on an
  isolated request (`isolateObjectProperty`), so the caller's own request is left where it was. This closes
  a silent footgun — `payload.findByID({ branch, req })` used to return whichever branch got there first.
- **Populated relationships are branch-scoped.** The dataloader's cache key includes the branch, so one
  request can hold two branches' copies of the same related document, and a `depth`-populated relationship
  pointing at a document that exists _only_ on a branch resolves there.
- **The read predicate and canonical-ID translation**, wired through `db-mongodb` and `drizzle`, including
  the `select` guards that keep injected columns from being dropped in include mode.
- **Copy-on-write updates, tombstone deletes**, and the change manifest that resolves them in one query
  per request.
- **Drafts, versions and publishing per branch**, including a branch's version chain hanging off its own
  shadow row, and history that reads main's versions as the branch's ancestry.
- **Globals**, including merge and discard — which needed one new adapter capability,
  `db.deleteBranchGlobal`.
- **Branch-aware joins, relationships and `findDistinct`.**
- **Localized fields** — per-locale forking, and merges that write main one locale at a time.
- **Array and block fields** — forks and merges re-key nested rows so relational adapters do not collide.
- **Merge**: selective apply, `dryRun`, `main-moved` warnings, `onProgress`, `closeBranch`, lifecycle
  hooks, and an append-only ledger with before/after snapshots per merged document.
- **Discard**, the mirror of merge: drop the branch's row, whatever the operation was.
- **The per-document access preflight** — the enforcement boundary, evaluated as the merging user in two
  tiers (group by `(collection, operation)`, then one query per unresolved group).
- **Branch visibility gate** — reading or writing through a branch requires read access to that branch's
  document, checked once per request at the REST and GraphQL boundaries. Anonymous callers can only ever
  reach production, with no configuration.
- **A `scheduleMerge` jobs task**, shaped like scheduled publish, with permissions re-checked at fire time
  and progress written to the branch.

### APIs

- **Local API** — `branch` on every operation, `branch: false` to bypass, `payload.branches.merge()` and
  `payload.branches.discard()`.
- **REST** — `?branch=` on reads and writes; `POST /api/payload-branches/:id/merge` (with `changes`,
  `closeBranch`, `dryRun`, `stream`) and `.../discard`.
- **GraphQL** — `branch` argument on collection and global queries and mutations.

### Admin panel

- Branch switcher in the app header, with merged / scheduled tags, a create-and-switch modal, and the
  selection stored in the user's `admin` preference.
- Every ordinary view scoped to the active branch: lists, edit views, drafts, version history, the API tab,
  publish and save-draft, bulk edit and delete.
- A review view per branch: changed documents and globals, field-level diffs against production,
  selection, merge and discard.
- Merge modal — one instance, opened from anywhere: change summary, review link, merge-now with streamed
  progress and a held-open receipt, or schedule-for-later; close-branch offered only when nothing would be
  left behind.
- Branch history below current changes: one section per merge event, paginated, diffed from ledger
  snapshots.
- Scheduled merges: banner, expandable per-document list, "Scheduled to merge" tag in the switcher, cancel
  or schedule another, several at once.
- Branch lifecycle surfaced as status pills; `closed` refuses writes.

---

## Known limitations

### Not built

- **`dangling-reference` warnings and dependency ordering on selective merge.** Merging a document but not
  the branch-created document it references leaves main pointing at a row hidden from main. Nothing errors;
  population falls back to the raw ID.
- **`broken-reference` warnings on discard.** Discarding a branch-created document cascade-deletes inbound
  `_rels` rows, including from main documents that were pointed at it on the branch. Silently severed.
- **`unique-collision` as a `blocked` reason.** Two branches can each hold `slug: 'about'`; merging the
  second violates main's constraint. Caught by the database rather than the preflight, so it surfaces as an
  error instead of a per-document refusal.
- **No way to act on a `main-moved` warning** other than merging anyway.
- **No "reopen" for a closed branch in the panel.** Terminal by design, but a branch closed by mistake
  needs a direct edit to the row.
- **No branch-from-branch.** A v1 non-goal; every branch forks from `main`.

### Gaps with a known shape

- **The Local API does not gate an unreadable branch.** The HTTP boundary refuses with `403`; a Local API
  caller passing `branch` explicitly under `overrideAccess: false` is not checked. Server callers are
  trusted by default everywhere else in Payload, but the design asks for the refusal.
- **`db.updateMany`, `db.deleteMany`, `db.upsert`, `db.updateVersion` and `db.countGlobalVersions` have no
  branch predicate.** Everything Payload itself routes through them is covered — bulk update and delete
  fork and tombstone per document, and the version writes that mattered are fixed — but a direct adapter
  call is unscoped.
- **Response caching is not addressed.** Any Next.js or fetch cache keyed only on URL will serve one
  branch's content to another. Branch has to be part of the cache key.
- **GraphQL: a branch named on one field carries to later fields in the same request.** Resolvers reassign
  `context.req`; `locale` behaves identically. Reading two branches in one document needs two requests.
- **The global merge preflight treats a `Where`-returning `update` access function as permissive.** A global
  is one document, so there is nothing for the `Where` to narrow, and refusing would block a merge the same
  user could perform by hand on main.
- **A scheduled merge needs the jobs queue to actually be running**, exactly as scheduled publish does.

---

## Query cost

Asserted, not estimated: `test/branching/perf.int.spec.ts` counts every `payload.db.*` call per operation
and fails if a number changes. Identical on MongoDB and SQLite.

| Operation                      | On main | On a branch      | Overhead |
| ------------------------------ | ------- | ---------------- | -------- |
| `find`                         | 1       | 2 (1 branching)  | +1       |
| `findByID`                     | 1       | 2 (1 branching)  | +1       |
| `count`                        | 1       | 2 (1 branching)  | +1       |
| `findDistinct`                 | 1       | 2 (1 branching)  | +1       |
| `find` (drafts)                | 1       | 2 (1 branching)  | +1       |
| `findVersions`                 | 1       | 1                | +0       |
| `findGlobal`                   | 1       | 1                | +0       |
| `create`                       | 1       | 3 (2 branching)  | +2       |
| `update` — first write (forks) | 3       | 8 (3 branching)  | +5       |
| `update` — later writes        | 3       | 6 (2 branching)  | +3       |
| `delete` (tombstone)           | 4       | 10 (4 branching) | +6       |
| `updateGlobal` — steady state  | 3       | 4 (1 branching)  | +1       |

**Off costs nothing.** A read of a `branching: false` collection and a read of a branchable collection on
main issue exactly the same number of queries — asserted. With `branching` unset no fields are injected and
every helper returns before touching the database.

**Reads pay one query per request, not per read.** The change manifest is memoized on `req.context`: three
reads across two collections in one request cost 3 content queries + 1 manifest. `findVersions` and
`findGlobal` pay nothing — version _history_ resolves synchronously, and a global fetches both candidate
rows in one query and picks.

**Writes pay once per document per branch.** The first write forks; later writes find the copy already
there. What remains on a later write is one branch-row read (is the branch closed?) and one manifest load.

**Bulk writes scale linearly** — each matched document forks — plus one re-read of the matched set.

### Optimizations applied

Five changes roughly halved the write cost. Each is a cache or a fold, none change semantics:

1. **One branch-row read per request.** `assertBranchWritable` and `reopenBranchOnChange` both read
   `payload-branches` by slug; the row is now memoized in the per-request branch state, and the reopen hook
   answers "was this branch merged?" from it instead of querying. The access-checked visibility gate keeps
   its own read deliberately — a row fetched with `overrideAccess: true` must never stand in for one fetched
   with access control. **Saved 1 per write.**
2. **The fork asks one question instead of three.** `forkDocument` read the branch's copy by canonical ID,
   then the row by its own primary key, then main's row. One query over `_branch in [branch, 'main']` with
   `id` or `_branchDocID` matching answers all three, and the branch's row wins when both come back — the
   pick `pickBranchGlobal` already made for globals. **Saved 2 on first touch.**
3. **`resolveBranchRowID` is memoized** per request, collection and canonical ID, and the fork primes it
   with the row it just created. **Saved 1 per write.**
4. **The manifest is updated in place after a fork** rather than dropped and reloaded. It needed to learn one
   ID, not re-read every change row on the branch — and every save the panel makes is a write followed by a
   read. **Saved 1 per write-then-read request.**
5. **A global's "already registered" answer is remembered** for the rest of the request, which matters for a
   request writing several globals or one repeatedly. **Saved 1 per repeat write.**

Reads are at the floor: one manifest query per request is the irreducible cost of knowing which documents a
branch shadows.

---

## Bug classes this feature keeps producing

Worth reading before adding to it. A coverage audit found eight of these, and every one produced wrong data
rather than an error.

**Sibling code paths diverge silently.** `find` passed the whole request to the adapter and `findByID`
narrowed it, losing the branch. `resolveBranchVersionHistoryQuery` rewrote `parent` constraints and
`resolveBranchVersionQuery` did not. `createVersion` was branch-aware and `updateVersion` was not.
`updateByID` forked in a hook and `update` returned early from the same hook. In each case one path kept
working, which is exactly what let them survive a suite exercising only that path.

**A `select` in include mode drops injected columns**, leaving the canonical-ID projection with nothing to
map from, so shadow-row primary keys leak into the API. `withBranchIDSelect` / `withBranchVersionSelect`
force them back in.

**Reading a scalar that localization makes an object.** `_status` is per-locale when localization is on, so
reading it as a string made every publish on a branch look like an untouched fork: merge applied nothing,
consumed the change, and reported success.

**Copying rows verbatim under a relational adapter.** Array and block rows own primary keys, so a fork or a
merge that carries them collides. Mongo stores them as subdocuments and never notices.

**Writing a document you read before forking.** Fork-then-write stamps the source row's `_branch` onto the
new copy, and the copy then surfaces on main as a duplicate. Re-read after forking.

**Deciding branch state from a clock.** A fork and the publish that follows it can land in the same
millisecond.

**Test-side: `waitUntil: new Date()` never fires.** The jobs runner takes jobs strictly _before_ now, so a
job queued and run in the same millisecond is skipped silently, and every assertion afterwards reads a merge
that never happened. Backdate it — and assert on the job row, because "main was not changed" looks identical
whether the merge refused or never ran.

---

## Where the code lives

| Area                                      | Path                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Resolution, predicate, manifest, identity | `packages/payload/src/branching/`                                                 |
| Merge, discard, preflight, effective ops  | `packages/payload/src/branching/{merge,discard,preflight,effectiveOperations}.ts` |
| Internal collections, scheduled task      | `packages/payload/src/branching/{collections.ts,schedule/}`                       |
| Adapter integration                       | `packages/drizzle/src/`, `packages/db-mongodb/src/`                               |
| Switcher, review view, merge modal        | `packages/ui/src/{elements/BranchSelector,views/Branch,elements/MergeBranch}/`    |
| GraphQL argument                          | `packages/graphql/src/{schema,resolvers}/`                                        |
| Tests                                     | `test/branching/`                                                                 |
