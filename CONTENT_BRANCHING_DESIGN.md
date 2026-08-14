# Content Branching for Payload — Design Proposal

**Status:** Design approved; implementation in progress on `feat/content-branching`.
Targets Payload 4.0.

**Implemented and verified on MongoDB, Postgres and SQLite:** phase 0 spike; config surface and
exclusions; schema injection and unique-index rewriting; branch resolution across the request; the
change manifest; the read predicate and canonical-ID translation wired through `db-mongodb` and
`drizzle`; copy-on-write updates; tombstone deletes; drafts, versions and publishing per branch;
globals; branch-aware joins; merge with selective apply, `dryRun`, `main-moved` warnings and branch
lifecycle hooks; the per-document access preflight; a REST endpoint for merge.

The full loop works: branch, edit in isolation, review what changed, merge some or all of it back
under the merging user's own permissions.

**Not yet implemented:** `updateMany` / `deleteMany`, dangling-reference warnings, and most of the UI.
See §19 for phasing.

**Phase 6 UI — started.** The branch switcher is in, as a pill in the app header sitting to the left of
the breadcrumb trail — styled like the list view's Columns / Group by / Filters controls, with a branch
icon leading and a chevron trailing. It opens a searchable popup listing `main` plus every open branch
the user can read, above two pinned actions: "Manage branches…", which links to the `payload-branches`
list view, and "Create new branch". The selection is stored in the user's `admin` preference (§15) and
threaded onto admin API calls as an explicit `branch` argument, the way `locale` is.

"Create new branch" opens a modal rather than routing to the `payload-branches` create view. Creating a
branch is a two-field act — a name, and an optional description — and the slug is derived from the name
server side, so there is nothing on the full create view worth leaving the current screen for. Its
primary action is labelled "Create and switch", because that is what it does: creating a branch is a
declaration of intent to work on it. The modal names its source branch (`main`, badged `default`) as
static text rather than a picker, since branch-from-branch is a v1 non-goal (§1). The create view still
exists and still switches onto what it creates, so a branch made from the list view behaves the same way.

A slug collision surfaces against the **name**, not the slug. The slug is derived, so reporting
"Value must be unique" against a field the editor never filled in would be unactionable.

**Slugs are not rendered anywhere in the switcher** — not beside the branch names in the list, and not
beside the active branch pinned above them. They stay _searchable_, because the slug is what URLs and the
API expose and an editor may know a branch by it, but showing it doubles the width of every row to restate
the name in kebab-case. For the same reason the pinned row carries no separate "Manage" link: on a branch,
the branch's own name is the link to its manage view, which leaves the row holding exactly two things —
where you are, and the one action that is not reachable from anywhere else.

It reads as a scope control rather than a location, which is what it is: everything to its right is
scoped to the branch it names. It sits outside `StepNav` for the same reason — the trail collapses under
width pressure, and the active branch is not something that should ever collapse into a `…` menu.

Still to do, and known-broken:

- **Merge now and scheduled merge both work.** The modal offers either: merge now streams progress (§16),
  or schedule queues a `scheduleMerge` job for a chosen time. Both respect the changed-documents selection
  and both offer "close this branch after merging". A queued merge is then visible where the branch is: a
  banner and an expandable per-document list on the branch view, a `Scheduled to merge` tag in the
  switcher, and cancel/schedule-another in one modal. Several schedules can coexist. A scheduled merge
  needs the jobs queue to actually be running, exactly as scheduled publish does.
- **No way to act on a `main-moved` warning** other than merging anyway.
- **A closed branch cannot be reopened from the UI.** The status is terminal by design (§16), but there is
  no "reopen" action for the case where it was closed by mistake — only a direct edit to the branch row.
- **Post-merge diffs come from the ledger, not from live documents.** Each merge event stores a before/after
  snapshot per document it applied, so the history diffs even after the branch's copy is gone and main has
  moved on (§16).
- **Translations are complete.** All 71 `branching:` keys exist in `en.ts` and in every one of the 43
  other locales, so the translations type build passes again. The strings were written by hand rather than
  by `translateNewKeys`, reusing each locale's already-established branching vocabulary (its own words for
  branch, merge, changed documents) so the new copy matches what was there.
- **Call-site threading is now derived rather than listed.** The old hand-compiled list has been
  replaced by a mechanical sweep: every file that builds an API URL, diffed against every file that
  reads `useBranchParam`. Auth, preferences, query presets and the storage-side upload fetches remain
  deliberately unthreaded. Everything the sweep turned up is resolved:
  - `SaveDraftButton` and `Status` (revert-to-published) omitted `branch` on **writes** — both fixed.
  - The API view now sends and displays `branch` on both halves (`Document`'s `apiURL`, which the view
    shows as the request it made, and the client's own fetch), so it inspects the document the rest of
    the panel is scoped to. Sending it was not enough on its own — see the request-level fix below.
  - The versions list's `fetchURL` was **dead** — declared, passed to `VersionsViewClient`, never read.
    Pagination goes through `ListQueryProvider` and the router, which re-renders the server component
    with the branch already resolved from `req`, so the list was correct all along. Removed, because an
    unbranched URL that looks live is worse than a bug: the next reader "fixes" it instead of deleting it.
  - Scheduled publish is **refused on a branch** rather than threaded (§18). The job runs later, on a
    request with no branch, so it would publish main's copy at the appointed time; threading `branch`
    onto the drawer's `payload-jobs` query would have made the UI look branch-aware while the job stayed
    branch-blind. `SchedulePublishButton` hides itself on a branch and `schedulePublishHandler` rejects
    it server-side.
- **`branch` is materialized onto the request, not left in the query string.**
  `createPayloadRequest` now sets `req.branch` from the `branch` param, beside where it resolves `locale`,
  because `resolveBranch`'s documented precedence was not enough on its own. Several operations —
  `findByID` among them — hand the database adapter a _narrowed_ request carrying `branch`, `context`,
  `payload` and `transactionID` rather than the whole thing. That request has no `query`, so a branch
  still sitting unread in the URL was invisible to the read and it resolved against `main`.

  This is what made the admin panel's API tab show main's document while displaying a `?branch=` URL it
  had genuinely requested. `find` was unaffected — it passes the whole request through — which is exactly
  what made the bug confusing: the list agreed with the branch and the by-ID read did not. Both are now
  pinned by tests. Set only when the param is present, so an unbranched request is byte-for-byte what it
  was.

  Worth deciding separately: a raw REST caller can name any branch by query param, and nothing checks
  that they can read it. That predates this fix (`find` always honoured the param) and is the same gap
  §15 names for `resolveBranch`.

- **Stale-branch handling is provider-level only.** A preference naming an unreadable branch falls back
  to `main` in the UI, but `resolveBranch` itself still does no validation, and an unreadable-but-
  existing branch does not error as §15 requires.
- **Browser coverage has only just started.** `test/branching/e2e.spec.ts` covers canonical document
  identity on a branch — the list view's IDs and links, and opening the edit view behind them. Every
  other click-through path is still unexercised, and manual testing is turning up bugs the integration
  suite misses because it does not query the way the admin panel does.

**One class of bug worth naming**, because the first manual pass hit it immediately: a `select` in
include mode narrows a row to exactly the fields named, which drops the injected identity columns
(`_branchDocID`, `_branchParent`) and leaves the canonical-ID projection with nothing to map from. The
projection then silently no-ops and shadow-row primary keys leak into the API. The admin list view
selects only its visible columns, so branch reads were correct over plain REST and wrong in the panel —
with an unopenable edit view behind every row, since no ID rewrite resolves a shadow row's own key.
`withBranchIDSelect` / `withBranchVersionSelect` (§11) now force those columns back in, and share one
`isBranchProjectionActive` guard with the projection so the two cannot disagree. The same omission meant
`updateOne` never projected at all, so a save on a branch returned the shadow row's ID.

The general lesson for the rest of phase 6: **anything that reads through `select`, or returns a
document from a write, needs its own branch coverage.** Integration tests that call `find` without
`select` will not catch this class at all.

**A coverage audit generalised that lesson and found seven more.** The audit was prompted by
`GET /api/<collection>/<id>?branch=x` returning main's document: the integration suite had 100+ branching
tests and every one used the Local API, which sets `req.branch` directly, so no test ever exercised a
branch arriving as something to be _read off the request_. Two axes were unexercised — entry points other
than the Local API, and field shapes the test config did not contain (no `localization`, every field flat,
no `maxPerDoc`, no autosave). Between them they hid:

| What was wrong                                                                                                       | How it presented                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enforceMaxVersions` pruned by canonical `parent`, unscoped by `_branch`                                             | Saving on a branch **deleted main's whole version chain** (2 → 0) and never pruned the branch                                                                               |
| `updateLatestVersion` selected main's latest row as branch ancestry, then rewrote it                                 | Unpublishing on a branch **wrote branch content into main's version row**                                                                                                   |
| `resolveBranch` ignored the `_branchBypass` sentinel and fell through to `?branch=`                                  | A merge over HTTP with `?branch=` silently no-op'd its create promotion                                                                                                     |
| Bulk `update({ where, branch })` never forked; forking without re-reading then stamped `_branch: 'main'` on the copy | Wrote **straight to main**; the naive fix made the copy surface on main as a duplicate                                                                                      |
| `findDistinct` had no branch predicate in either adapter                                                             | Branch rows fed main's distinct values                                                                                                                                      |
| `resolveBranchVersionQuery` never rewrote `parent`, unlike its history sibling                                       | Filtering a drafts read by document ID returned **0 on a branch, 1 on main** — the panel's own read of one draft                                                            |
| `_status` read as a scalar in the effective-operation table                                                          | With localization on, `_status` is per-locale, so **every** publish on a branch looked like an untouched fork: merge applied nothing, consumed the change, reported success |
| `forkDocument` copied array/block rows verbatim, and the merge wrote them onto main                                  | `UNIQUE constraint failed` on every fork of a document with blocks under a relational adapter — branching was unusable with realistic schemas                               |

Two of the audit's suspicions turned out to be **fine**, and were pinned rather than "fixed": inbound
`_rels` do survive a merge (the in-place promotion works, which was the plan's own #1 risk), and REST
`PATCH`/`DELETE` with `?branch=` were already correct.

The shape of almost all of them is the same, and worth stating as the rule for the rest of this work:
**where two sibling code paths answer the same question, they diverge silently.** `find` passed the whole
request and `findByID` narrowed it. `resolveBranchVersionHistoryQuery` rewrote `parent` and
`resolveBranchVersionQuery` did not. `createVersion` was branch-aware and `updateVersion` was not.
`updateByID` forked in a hook and `update` returned early from the same hook. None of these produced an
error; each produced the wrong data on one path while the other kept working, which is exactly what makes
them survive a test suite that only exercises the working side.

**A third class, same manual pass: writes that build their own action URL.** A draft saved on a branch
went to `main`. The form's action comes from `DocumentInfo` and carries `branch`, but `SaveDraftButton`
composed its own URL from scratch and omitted it — so the draft was created on main, absent from the
branch's changeset, and visible on the branch only because branch reads fall through to main. It read
as "drafts don't show up in the changeset"; the draft was never on the branch at all. `Status`'s
revert-to-published had the identical shape, reading main's published document and writing it back to
main from a branch. Both now take `useBranchParam`. Every other write in `packages/ui` was already
threaded, which is why publishing worked and only the draft path did not.

The lesson generalizes past branching: **a write that does not submit through the form's own `action` is
invisible to anything the form scopes.** Integration tests cannot catch this class either — the bug is
in the URL the browser builds, so it needs an e2e that clicks the button.

**A second class, from the same manual pass: side effects that run before the tombstone is decided.**
A delete on a branch becomes a tombstone, but that decision lives in `db.deleteOne` — and
`deleteByID` runs its cascades _before_ calling it. `deleteCollectionVersions` cascaded by canonical
ID, which is main's `parent`, so deleting on a branch stripped main's version chain while leaving its
row: a published document disappeared from main's own drafts list, with nothing about the branch to
explain it. Fixed by scoping the cascade with `resolveBranchVersionDelete`, which addresses the
branch's shadow row and constrains `_branch`, so a delete can only ever reach the rows of the branch
performing it. Version reads now also exclude tombstoned documents by canonical identity
(`loadBranchDeletions`), because version rows carry no `_branchOp` to hide behind.

Two faults of the same shape in the upload path are fixed alongside it:

- `deleteAssociatedFiles` unlinked `staticDir/<filename>` before the tombstone was decided, so
  deleting an upload on a branch removed main's file while main kept the row pointing at it.
  `willBranchAbsorbDelete` now answers "will this delete become a tombstone?" from the document already
  fetched for the delete — no extra read — and both delete operations skip the file cascade and the
  scheduled-publish cascade when it does. A document created on the branch is exempt: nothing of
  main's stands behind it, so its side effects are its own.
- `getBaseUploadFields` marks `filename` unique, but `injectBranchFields` walks `collection.fields`
  before the upload base fields exist, so `filename` kept a global unique index and a branch's copy of
  an upload collided with main's — forking or tombstoning it failed validation outright.
  `injectBranchFields` now sets `upload.filenameCompoundIndex = ['filename', '_branch']`, which is the
  supported hook: `getBaseUploadFields` leaves `filename.unique` unset when it is present, and both
  adapters build a unique compound index from it.

The pattern to watch for across the rest of the delete and write paths: **any work done before
`db.deleteOne` or `db.updateOne` is branch-blind unless it was told about the branch.**

### Version history on a branch is a continuation of main's

**Decided, and it supersedes §7 step 2.** A branch's version history reads as main's history followed
by the branch's own versions. Main's rows _are_ the ancestry, so the fork copies nothing — §7 step 2,
which said the fork should copy main's `latest` version into the branch, is withdrawn: it would
duplicate every row it copied and give the branch a history that appears to start from nowhere.

`findVersions` previously applied no branch predicate at all in either adapter, so history on a branch
mixed in main's versions _and every other branch's_. It now uses `resolveBranchVersionHistoryQuery`,
deliberately separate from `resolveBranchVersionQuery`: the latter hides main's versions for any
shadowed document, which is right when listing one row per document in `queryDrafts` and exactly wrong
here, because those hidden rows are the ancestry being asked for. Version rows also project `parent`
back to the canonical document, since a branch version hangs off the shadow row.

The identity rewrite for `parent` matches the canonical ID _and_ the raw value, unlike the one for
collection `id`. Internal reads resolve the branch's shadow row first and then ask for its versions by
that row's primary key, so requiring the canonical column to be null would lose them.

Surfacing it in the admin, from a manual pass:

- The **Versions tab count** came from `countVersions`, which was branch-blind, while the list came from
  the branch-aware `findVersions` — so the tab said 3 while 4 rows rendered. Both now share
  `resolveBranchVersionHistoryQuery`, so they cannot disagree, and `getVersions` threads the branch it is
  reporting for rather than silently reporting main's.
- The versions table gains a **Branch column**, rendered as a pill, when branching is enabled. Since a
  branch's history includes main's rows, without it there is no way to tell whose version you are
  looking at.
- The injected columns no longer appear as **field diffs**. `buildVersionFields` now skips
  `admin.hidden` fields, which is right in general — a field hidden from the admin panel has no business
  in an admin diff — and it is what kept `_branchDocID` and `_branchOp` out, where they read as noise
  under machine-generated labels like "\_branch Doc I D". The injected fields also carry explicit labels
  now, so they read properly anywhere they do surface.
- `_branch` is shown as **metadata on the diff selectors** — a pill beside "Comparing against" and
  "Currently viewing" — rather than as a field diff. Which branch a version came from is information
  about the version, not content of the document, and on a branch the two sides of a comparison
  routinely differ.

**One refinement outstanding:** versions main records _after_ a branch forked are not that branch's
past, so history should stop at the fork point. There is no marker to stop at. The registry stores
`baseUpdatedAt`, which is main's _document_ `updatedAt` at fork, and version rows are written just
after the document — so comparing a version's `updatedAt` against it excludes main's latest version,
the one that matters most for ancestry. This needs a fork-time marker of its own; `baseUpdatedAt`
cannot be repurposed, because §16's "main moved" warning depends on its current meaning.

**Where access is enforced.** `merge()` defaults to `overrideAccess: true`, matching every other Local
API operation, so server-side callers are trusted by default. `POST /<branches>/:id/merge` passes
`overrideAccess: false` with the authenticated user, which is where the preflight in §13.3 becomes the
enforcement boundary.

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
2. Write a `payload-branch-changes` row recording `baseUpdatedAt` and `baseVersionID`.

**No version rows are copied.** An earlier draft of this section had the fork copy main's `latest`
version into the branch, so that branch history had a starting point. That is withdrawn — a branch's
history reads as a continuation of main's, so main's rows already serve as the ancestry and copying
them would duplicate every one. See "Version history on a branch is a continuation of main's" above.

Main's history is untouched either way.

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

**How the table is resolved** (`branching/effectiveOperations.ts`). The shadow row alone cannot answer
this, and reading only the row was a real bug rather than a hypothetical one: a fork copies main's row
wholesale, so a document forked from a published main row carries `_status: 'published'` even when every
edit on the branch was a draft save — and draft saves never touch the row. Merge therefore read main's
own pre-fork values back and applied them as a publish, reporting success while changing nothing, and
the changed-documents diff (which read published state on both sides) rendered empty for a change that
was really there.

The missing half is the branch's newest version, plus one discriminator: `baseUpdatedAt`, recorded on
the registry row at fork time. Only a publish rewrites the shadow row, so a row whose `updatedAt` still
matches `baseUpdatedAt` proves the branch never published — whatever it changed lives entirely in its
draft chain. That separates the two cases the row cannot:

- row unchanged since the fork + newer draft ⇒ one `update`, written with `draft: true`, main's
  published row untouched.
- row rewritten since the fork ⇒ `publish`, plus a second `draft: true` write when a newer draft sits
  above it.

Collections without drafts short-circuit to a single `update` (or `create`): with no published/draft
distinction, there is no publish to require publish permission for.

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

**Implemented, and it needed one new adapter capability.** Merge and discard both filtered the change
registry to `entityType: 'collection'`, so a global edited on a branch was recorded and then permanently
stuck: visible in the changeset, impossible to apply or throw away. Globals now travel the same registry
and a separate pass — there is no shadow row to resolve, no effective-operation table to consult, and
nothing to collide on a unique index, so putting them through the collection pipeline would have been
ceremony.

The capability is `db.deleteBranchGlobal`. Dropping the branch's copy is what makes the branch read
through to main again, and it is not optional: reset the copy to main's values instead and it shadows main
for good, so an edit made on main after the merge would be invisible on a branch that had already merged
it. There was no existing way to delete a global — globals are singletons, so nothing else in Payload ever
does — and storage differs too much to do it generically: Mongo keeps every global in one discriminated
collection (delete by `globalType` + `_branch`), Drizzle gives each its own table (delete by `_branch`).
Declared optional on the adapter interface, since it exists only for branching, and merge fails loudly
rather than silently no-opping when an adapter lacks it.

Globals merge **after** documents, because a global usually points at documents rather than the other way
round, so whatever it references is already on main by the time it lands.

**The admin panel renders them like anything else.** A changed global is a row in the changeset next to the
documents — same list, same expandable diff, same checkbox, since merging works on the same registry rows —
labelled with the global's own label rather than a collection's singular. The diff is the version-comparison
renderer again, pointed at the global's fields: two copies of one thing, only what changed. In the merge
history it renders from the ledger's before/after snapshots and links to the global's edit view rather than
to a document. `ChangeSummary` counts globals too, so "Changes to 2 Posts and 1 Header" is one sentence
about both kinds.

One limit remains: the global preflight treats a `Where`-returning `update` access function as
permitting the merge: on a collection a `Where` narrows _which_ documents may be written, which tier 2
resolves with a query, but a global is one document and refusing on that basis would block a merge the
same user could perform by hand on main.

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

### 12.5 The one question a document's own access control cannot answer

Everything above says access control needs no new primitive, and for _who may read this document_ that
holds: `req.branch` is in scope, the rules are written once, on the collection. There is a second question
hiding behind it, though, and it is not the same one:

> **May this reader see branch-scoped state at all?**

A document's rules answer "who may read _this content_". The branch answers "may this reader be looking at
a proposal rather than production". Answering the second with the first is what makes it feel duplicative
— and it isn't, because the second question has the same answer for every collection in the project.

**Why the document's rules cannot express it.** Take the standard public-website pattern:

```ts
access: {
  read: () => ({ _status: { equals: 'published' } })
}
```

On a branch, a document with `_status: 'published'` is published _on the branch_ — the whole point of
branching is that this is not live. But the rule above is perfectly true of it, so
`GET /api/pages?branch=halloween` serves unreleased content to an anonymous reader. Expressing the gate
per collection means appending `&& !req.branch` to every public rule in the project, where one collection
missed is a silent leak and the rule is identical in all of them. That is the shape of thing that belongs
in one place.

**What is true today**, precisely, so this is not overstated:

- Collection access runs identically on a branch (§12.2) — deliberately.
- `resolveBranch` validates nothing. It reads the slug from the argument or the query param and loads the
  change manifest by that slug through `payload.db` (no access control). The `payload-branches` **row is
  never read**, so nothing checks whether the caller may see the branch it named.
- Therefore any caller whose document access permits a row can reach that row's branch copy by adding
  `?branch=`. For a project whose collections are all default-access (`defaultAccess` = an authenticated
  admin user) nothing is exposed. For any project with a public read rule — that is, every public website
  — branch content is readable by anyone who can read main.

**Measured, not inferred.** With a collection whose read access is the canonical
`() => ({ _status: { equals: 'published' } })`, a document published on `main` and then updated and
published on a branch, an **unauthenticated** REST read returns:

| Request                                      | Status | Title returned         |
| -------------------------------------------- | ------ | ---------------------- |
| `GET /api/public-pages/:id`                  | 200    | `live on main`         |
| `GET /api/public-pages/:id?branch=draftwork` | 200    | `unreleased on branch` |

Adding six characters to a public URL serves unreleased content to the world. That is the argument for the
gate, and it is why the default matters more than the configurability.

#### The gate, at the request level — implemented

**Reading or writing through a branch requires read access to that branch's document.** Evaluated once per
request, not per document, by reading `payload-branches` with `overrideAccess: false` and the caller's user.
Not found, or not readable, is the same outcome: the branch does not exist for this caller.

`branching/assertBranchReadable.ts`, called from the two HTTP boundaries — `handleEndpoints` (all of REST,
including custom endpoints) and the GraphQL `POST` handler. **Not** from `createPayloadRequest`, which was
the first attempt and is wrong twice over: the check needs the resolved user, and throwing from inside the
constructor leaves `handleEndpoints` with no `req` to format the error against, so a clean 403 came back as
a `TypeError` out of `routeError`. It also cannot live at the database layer, where the plan originally put
it: the request the operations hand the adapter is narrowed to `branch`, `context`, `payload` and
`transactionID`, so an access check there has nobody to check.

The Local API is deliberately not gated. Server-side callers are trusted by default there, exactly as they
are for every other permission in Payload, and the admin panel already resolves the editor's branch through
a readable-branches query (`getRequestBranch`). A project that wants the check on a Local API path passes
`overrideAccess: false` and gets it from the operation's own access control.

Three properties make this the cheap answer rather than a second permission system:

1. **It is a narrowing gate, never a grant.** Branch access and document access are ANDed. Being able to
   read a branch never lets anyone read a document they could not read on main, so it cannot become a way
   to accidentally widen access. Collection rules are still evaluated exactly once, and still in one place.
2. **The safe default costs nothing to configure.** `payload-branches` has no access block, so
   `defaultAccess` applies: authenticated admin users only. Anonymous requests can therefore only ever read
   `main`. That is the behaviour worth having by default — not a shortcut a project has to know to reach
   for.
3. **One query per branched request, zero for main.** A request on `main` still touches nothing, which is
   §15's central constraint.

#### Scenarios, and where each one is expressed

| What the project wants                                                | Where it goes                                                                                         | Layer               |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------- |
| Public site serves live content only; branches invisible to the world | nothing — the default                                                                                 | branch              |
| Public preview of one branch on a staging domain                      | `payload-branches.read` returns `{ isPublic: { equals: true } }`, or checks a preview secret on `req` | branch              |
| Marketing sees only marketing's branches                              | `payload-branches.read` returns a `Where` (`{ team: { equals: user.team } }`)                         | branch              |
| Editors may publish on a branch but not on main                       | `access.update` conditional on `req.branch` (§12.2)                                                   | collection          |
| An editor may read a branch but not touch its documents               | ordinary collection `update` access — unchanged on a branch                                           | collection          |
| Only leads may merge                                                  | the optional merge gate (§12.1) plus the per-document preflight (§12.3)                               | branch + collection |
| No merges during a freeze window                                      | merge access function returning `false` on a schedule                                                 | branch              |
| Contractor may work in one branch and nowhere else                    | branch `read` scoped to that branch; collection rules unchanged                                       | branch              |

The pattern in that table: **the branch layer answers "which proposals exist for you", the collection layer
answers "what may you do with content".** Nothing appears in both columns.

#### Open questions, to settle before implementing

- **Does readable imply writable?** Proposed yes: a branch is a shared workspace, and its readers are its
  collaborators, with the collection's own rules still deciding what they may change. "Read but not write
  this branch" is expressible later as an explicit gate if a project asks for it; inventing it now doubles
  the surface for a use case nobody has stated.
- **What does an unreadable branch do?** **Settled for HTTP: `403 Forbidden`**, and the same for a branch
  that does not exist, because distinguishing them tells an anonymous caller which branch names exist. A
  **stored admin preference** still falls back to `main` and clears itself, which is what the provider
  already does — a stale preference is not an attack, it is a branch someone lost access to. What §15 asks
  for and is still missing is the equivalent refusal for an explicit _Local API_ branch argument under
  `overrideAccess: false`.
- **Does the gate apply to `branch: false`?** No. That is the deliberate server-side bypass, and every
  caller of it is trusted code (merge, discard, cleanup).

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

Resolved once per request into `req.branch`, a first-class typed property alongside `req.locale` — and
resolved the same way `locale` is, which is the model this follows exactly (`getRequestLocale`):

1. **Explicit operation argument** — `payload.find({ collection, branch: 'halloween' })`, typed on every
   Local API operation. Also the escape hatch for cross-branch reads.
2. **`branch` query param** — parsed in `parseParams`, alongside `draft` and `trash`.
3. **Default `main`.**

**The branch is an argument, never ambient state.** No header, no cookie, and — importantly — **core
reads nothing from storage to resolve it**. A request that passes no branch is on `main`, full stop, so
an unbranched request pays nothing: no preference query, no lookup of any kind. This is the single
biggest constraint on the design of branch resolution, because the alternative taxes every
authenticated request in the system for a feature most of them aren't using.

**Where the persisted selection lives.** The admin UI stores the editor's branch in the `admin` user
preference (`PREFERENCE_KEYS.ADMIN`), so it follows them across browsers and machines. Turning that
preference into the argument is the **admin UI's** job, not core's: `getRequestBranch` runs inside
`packages/ui`'s `initReq`, exactly where and how `getRequestLocale` already resolves `locale` from its
own preference.

The branch shares the `admin` key with the rest of the panel's globally-scoped state — nav group
collapse, nav open/closed — rather than owning a key of its own. The nav already reads that key on
every admin render, so routing both through one cached read (`getAdminPreferences`) means resolving the
branch costs **no query of its own**, and still zero for everything that isn't an admin render. Writes
from the client must merge rather than replace, or a branch switch would drop the nav state sharing the
key.

This division is the whole point — core stays a pure argument-taking API, and the persistence lives in
the layer that actually has a UI to persist for.

GraphQL gets a `branch` argument on generated queries in
`packages/graphql/src/schema/initCollections.ts`, next to the existing `draft` and `trash` args.

**Implemented, and threaded through the request rather than through each operation's options.** Every
resolver already resolves `locale` by writing it onto the request it hands the operation, and `branch`
resolves the same way — one line per resolver instead of a new key in fifteen options objects, and it
reaches operations that take no `branch` argument at all. `branch` and `context` join the per-field
`isolateObjectProperty` list, and naming a branch resets that field's memoized branch state, because the
manifest is memoized per request and would otherwise be the previous field's.

Declared on collection queries (single, list, count, versions), collection mutations (create, update,
delete, duplicate, restoreVersion) and the global equivalents.

One limit, inherited rather than introduced: resolvers reassign `context.req`, so a branch named on one
field carries to later fields in the same request. `locale` behaves identically — this is GraphQL's
existing request model in Payload, not something branching changed — but it means "read two branches in one
document" needs separate requests. Worth fixing for both arguments at once if it ever matters.

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

### Discard: merge's mirror

Discarding reduces every operation to one act — drop the branch's own row — because on
a branch that row _is_ the change:

| Branch state      | Row dropped     | Effect                                     |
| ----------------- | --------------- | ------------------------------------------ |
| created on branch | the document    | It disappears from the branch              |
| forked and edited | the branch copy | The branch reads through to main again     |
| deleted on branch | the tombstone   | Main's document is un-hidden on the branch |

The branch's version chain goes with the row, scoped by `_branch` as well as `parent`
— main's chain shares no parent with it, but a wrong delete here would strip
production history, so it is said explicitly. The delete is guarded on the collection
actually having versions: the adapters resolve a version model by slug and throw when
there is none, so an unversioned collection would otherwise fail the whole discard
rather than skip a no-op.

**No preflight, unlike merge.** Discard touches only the branch's rows and leaves main
exactly as it was, so there is no production permission to check — a branch is a
proposal, and withdrawing one is not a production write. It is still a _write_, so a
closed branch refuses it: an archive that can be edited is not one.

Scoped by the same checkboxes as merge, and sitting beside it, because the two are the
same decision about the same set pointed in opposite directions. Confirmation stands in
front of it because it is the one action on that screen that destroys work rather than
promoting it.

**Unresolved**: dropping a branch-**created** row cascade-deletes inbound `_rels` rows,
including from main documents pointed at it on this branch. The `broken-reference`
warning (test 48) is not implemented, so that reference is severed silently.

### Reporting progress: the merge streams

A merge is the one Payload operation where "what is it doing right now" is a real question. It walks an
arbitrary number of documents one at a time, each a full write with hooks, validation and version
creation, so a branch of a few hundred documents takes long enough that a spinner is not an answer.

`POST /<branches>/:id/merge` with `stream: true` therefore responds in **NDJSON** rather than JSON: one
`{"type":"progress","current":N,"total":M,…}` line per change as it is applied, then a terminal
`{"type":"complete","result":{…}}`. `mergeBranch` takes an `onProgress` callback — awaited, so a slow
consumer throttles the merge rather than falling behind it — and the endpoint is what turns those calls
into lines. The Local API passes no callback and is unaffected.

**Why not a job and a polling endpoint.** Progress state would have to be written somewhere every
consumer could read it, which means either a `payload-jobs` row updated per document — a write per write,
doubling the transaction's work — or an out-of-band store branching does not otherwise need. Streaming
carries the state in the response that already exists, and the loop being reported on is the loop already
being run. No new persistence, no polling interval to tune, and progress cannot disagree with reality.

**What the stream costs.** The merge holds an HTTP connection for its duration, and it owns its
transaction rather than borrowing the request's — the response headers are sent before the merge finishes,
so the handler's own lifecycle ends too early to commit anything. A dropped connection therefore rolls
back: the client sees a stream that ended without a terminal event and reports that nothing was applied,
which is true. A merge too large to hold a connection for is what **scheduled merge** is for.

- Errors after the first byte are reported as `{"type":"error"}` inside the body, since the status line is
  long gone. `dryRun` ignores `stream` and answers in plain JSON — there is no progress to report.

### The branch lifecycle: a branch is a workspace, a merge is an event

Merging does **not** end a branch. The model is git's, where merging a branch into
`main` leaves the source branch untouched and you may keep committing to it and merge
again — what becomes terminal in that world is the _pull request_, not the branch.
GitHub then offers to delete the branch as a convenience, and that is the shape
adopted here: the merge modal offers "close this branch after merging", so the
author decides, at the moment they have the context to.

Three statuses, and no fourth:

| Status   | Meaning                                                                        |
| -------- | ------------------------------------------------------------------------------ |
| `open`   | The working state. Has pending changes, or does not; either way it is writable |
| `merged` | Nothing pending, and the last thing that happened was a merge                  |
| `closed` | Terminal. Read-only, cannot be merged again, kept as a record                  |

`merged` is **derived and reversible**: `mergeBranch` sets it only when the changeset
empties, and `reopenBranchOnChange` — an `afterChange` hook on the changeset registry
— returns the branch to `open` the moment it has a pending change again. Without that
hook, work resumed on a merged branch would be invisible, because merged branches are
filtered out of the switcher.

**There is deliberately no `partial` status.** "Partially merged" is not a state, it
is the combination of two facts that are already recorded separately — how many
changes are pending now, and when the branch last merged. Denormalising them into a
status would encode history in a field that describes the present, and it would be
wrong the moment someone added a change to a fully merged branch. The changed-documents
view says it directly instead: "Last merged on <date>. The changes below have happened
since." If a status pill for it is ever wanted, it is a display concern computed from
`mergedAt` plus the pending count — no migration.

`closed` is **enforced, not just displayed** (`assertBranchWritable`). Hiding a branch
from the switcher does not stop a `branch=<slug>` query param, or a client that was
already on it. Creates, updates and deletes all refuse; reads do not, because the
archive has to stay readable. The check is memoized per request, so a write touching
many documents costs one lookup.

**The switcher lists everything except `closed`.** Filtering `merged` branches out of
it was what made "keep the branch open" meaningless: the branch survived the merge, as
promised, but there was then no way back onto it — so the promise bought the author a
branch they could not reach. A merged branch is labelled as such in the list, since
"nothing pending" is worth knowing before switching onto it.

The branch's own page shows **both** at once: "Current changes" above, "Merge history"
below. That falls straight out of merging being an event rather than an ending — a
branch that merged and was then worked on again has two things to say, and showing only
the pending work hid everything the branch had already done, which is the state most
long-lived branches are in most of the time. The section headings appear only when both
are present; with one section the page heading already names it.

History is paginated, newest first, one section per merge event — a long-lived branch
accumulates events indefinitely, so it is the one read on that page that grows without
bound.

An earlier version instead put a single line above the pending list ("Last merged on
<date>. The changes below have happened since."). It is gone: with the history itself on
the page, "the changes below" had two possible referents.

### The merge ledger

A merge consumes the change rows it applies and drops the shadow rows behind them, so
a merged branch would otherwise have no record of what it did. `payload-branch-merges`
holds one append-only row per merge event: when, by whom, and the list of documents
with their operation and their **title as it was at merge time** — a document merged
under one name and renamed afterwards was merged under the old one.

A separate collection rather than a `mergedAt` flag on the change rows, for two
reasons. A branch can be merged more than once, and a change row belongs to exactly
one merge — the event is what needs identity. And retained change rows would have to
be excluded from `loadBranchManifest` on every request, which is the load-bearing
query in the read path; a collection nothing in that path reads costs it nothing.

**The archive diffs, from snapshots.** The live documents cannot produce one: the
branch's copy is dropped by the merge, and main then holds the merged values on the
only row that exists — and moves on from there. So each ledger entry stores `before`
and `after` for its document, captured either side of the write. `after` is read
_after_ the write rather than taken from the shadow row, so hook-derived fields are
included and the diff shows what main actually received.

That is two whole-document snapshots per merged document, kept indefinitely. It buys
a history that can still answer "what changed?" long after every other trace is gone,
and it is bounded by merge activity rather than by table size. The alternative —
retaining shadow rows — would have taught every read predicate about a third class of
row, which is a cost paid on every request rather than at merge time.

The snapshots are deliberately **excluded from the list read** (`select`) and fetched
per row through `render-merge-diff` when a row is opened, for the same reason
`renderBranchDiff` is lazy: a history can hold hundreds of documents and each diff is
a full field-tree render.

### One modal, raised against a target

The merge modal is mounted **exactly once**, by `MergeBranchProvider`, above both the
app header and the page. Every trigger calls `openMerge(target)` rather than rendering
a dialog of its own.

That is not tidiness. Mounting one per entry point put two dialogs on the same slug —
the switcher sits in the app header, above every view, so on the changed-documents view
both were mounted and `openModal` opened both. They stacked, and since only the one
whose button was pressed ran the merge, the other stayed on its form: merging appeared
to open a second modal on top of the first, showing progress while the one beneath
still asked whether to merge.

**The target belongs to the action, not the screen.** "Merge this selection" and "merge
the whole branch" are the same modal pointed at different things, and both can be
raised from the same page, so what it is pointed at is an argument to the trigger — not
context the screen happens to provide. The provider holds it and clears it on dismiss.

### What the modal says before you commit

Two facts and one way out, because "merge" is not reversible and the modal is the last
screen before it happens:

- **How much.** The count of changed documents, always — "All 12 changed document(s) on this branch will
  be applied", or "3 of 12" when a subset is selected. The changed-documents view already knows the
  number because it rendered them, so it passes it down; the switcher does not, so the modal counts them
  itself via `payload-branch-changes/count` **on open**. Counting eagerly would mean a query on every page
  load for a number nobody has asked to see, and a failed count degrades the sentence rather than the
  action.
- **A way to narrow it.** Opened from the switcher there is no selection to make, so the modal links to
  the branch's changed-documents view instead of leaving "everything" as the only option. Opened from that
  view the link is omitted — it would send the reader back to the page they are standing on.

### Scheduled merge

A `scheduleMerge` task on the jobs queue, deliberately the same shape as `schedulePublish`: a
`payload-jobs` row carrying the intent, the user who formed it, and a `waitUntil`, fired by whatever runs
the queue. Registered whenever branching is enabled; like scheduled publish, it only ever fires if the
queue is actually running.

Merging raises three questions that publishing one document does not, and the answers are the substance
of the task:

- **Whose permissions?** The queueing user's, re-resolved at fire time and applied through the ordinary
  preflight (`overrideAccess: false`). This is the one place the design deliberately _departs_ from
  scheduled publish, which falls back to `overrideAccess: user === null` when the user has since been
  deleted. A merge writes across production, so that fallback would quietly turn a deleted account into an
  unchecked one. The job fails instead — and a failed job is a signal someone can act on.
- **What if the branch moved?** Queued change IDs that no longer exist are skipped, because `mergeBranch`
  matches the selection against what is pending: a discarded or already-merged change simply does not
  match. A schedule with no selection applies whatever is pending when it fires, which is what "merge this
  branch at 9am" means.
- **What if main moved?** It proceeds. `main-moved` is advisory even interactively — branch data wins
  outright — and failing would leave the branch unmerged with nobody watching either. The warnings are
  returned as task output, so they stay inspectable on the job afterwards.

**Progress goes on the branch, not the job.** It describes the branch, and whoever wants it is looking at
the branch. `payload-branches.mergeProgress` holds `"12/230"` while a scheduled merge runs, and is cleared
in a `finally` — a stale marker outlives the run and reads as a merge still in flight. It is written at
roughly twenty points regardless of branch size: there is no reader mid-run beyond someone who happens to
open the page, so a write per document would double the transaction's work to narrate it to nobody. That
is the same reasoning that keeps the interactive path streamed rather than persisted.

Queue-time access is checked too, but it means something weaker: that the caller can reach the branch, and
that the branch is not closed (a closed branch must not accept a promise of a merge it will refuse). It is
not evidence of fire-time permission, which is why the preflight runs again when the job fires.

**Testing gotcha, since it cost a day of flaky runs.** The job runner takes jobs whose `waitUntil` is
_strictly_ less than now, so a test that queues with `waitUntil: new Date()` and immediately calls
`runByID` is racing the millisecond: when both land in the same one the job is not due, the runner finds
nothing, and `runByID` returns quietly having done nothing. Nothing errors — the job sits at
`totalTried: 0` — and every assertion afterwards reads a merge that never happened. Backdate `waitUntil` in
tests. This is not a product hazard: the UI only offers future times, and a real queue polls, so a merge
scheduled for "now" fires on the next tick.

The failure mode is worth recognising in general: a scheduled-merge assertion of the form "main was not
changed" passes identically whether the job refused to merge or never ran at all, so tests of the refusal
paths assert on the job row itself.

#### Showing a queued merge

A pending change with a date on it is a different object than a pending change, so the branch view says so
before it shows anything else: a banner, one line, `This branch is scheduled to merge on {{date}}.` It sits
above the changes because it changes what they mean — they are no longer a proposal, they are a proposal
with a deadline.

Below the banner each schedule lists the documents it will apply, reusing `ChangedDocuments` with
`selectable={false}`. The diff is the same question either way — branch against main — asked about a future
moment, so it would be strange to answer it differently here. Read-only matters: the checkboxes below
belong to a different, immediate decision, and a checkbox that cannot change anything is worse than no
checkbox.

**Several schedules can coexist**, because scheduling does not end the branch: schedule a merge, keep
working, schedule another. The banner names the soonest and counts the rest; the list renders all of them.
Each schedule's documents are resolved against what is pending _now_ rather than what was pending when it
was queued — a selection whose changes have since been discarded shows as such, which is the truth about
what will happen when the job fires.

**Actions live in a modal** rather than beside every row, so one schedule and five are managed the same
way. Cancelling is the only reason to open it, so it is the action on each row rather than a footer CTA,
and it is styled `destructive` because it is one — cancelling a queued merge is not recoverable, the
schedule has to be made again. It deletes the job row through the same `schedule-merge` server function
that created it. The button says "Cancel merge" rather than "Cancel": beside a dialog's own Close, a bare
"Cancel" reads as dismissing the dialog. There is no "schedule another" here — the branch's Merge button
already opens the modal that schedules.

#### One sentence for "what is merging"

`ChangeSummary` renders a set of changes as _"Changes to 2 Posts and 1 Page"_, optionally over a muted
_"2 Created · 1 Updated"_. A count answers how much; this answers what, which is the question that decides
whether a merge is the one the reader meant to run.

It is shared rather than written per caller — the merge modal, a scheduled merge and the manage modal are
all describing the same kind of set, and three hand-rolled sentences would drift. Three details are worth
keeping:

- **Collection labels come from the config**, singular or plural by count, through `getTranslation`.
- **The list is joined by `Intl.ListFormat`**, not by `", "` and `"and"`. Both the separator and the
  conjunction are language-specific, and this is a translated sentence.
- **Groups are capped at three**, with the rest rolled into "N more changes". Past that the sentence stops
  being readable and starts being a table, and the table already exists on the branch view.

The modal only gets a breakdown when it can be exact. Opened from the branch view it is handed the
selected changes directly. Opened from the switcher it reads them itself, bounded at 200 — and if the
branch holds more than that, the breakdown is dropped rather than computed from a sample, because "Changes
to 3 Posts" derived from the first 200 of 900 would read as a description of the merge and be wrong about
it.

The switcher carries it too — a `Scheduled to merge` tag beside the branch name, taking precedence over
`Merged`, so a queued merge is visible from anywhere without opening the branch. One `payload-jobs` query
in the branch provider covers every branch in the list.

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

**A branch's version chain has to be deleted deliberately, wherever the branch stops owning a document.**
A branch's versions hang off its _shadow row's_ primary key, not the canonical document ID, so nothing that
addresses the document cascades to them. Merge, discard and promotion-to-main therefore all route through
one helper, `deleteBranchVersionChain`.

Leaving the chain behind is not inert, because the drafts list reads _through_ versions: an orphaned branch
chain keeps answering for a document the branch no longer has a row for, and the branch lists that document
twice — once from its stale chain, once from main's — as two identical rows. Main looks correct throughout,
which is what makes it confusing to diagnose.

Two details are load-bearing. The delete is scoped by `_branch` and `_branchParent` as well as `parent`,
because a mistake here strips production history rather than branch history. And for a document _created_
on the branch — where the row is promoted rather than dropped — the chain is cleared **before** the
promoting write, not after: that write records main's first version for the row, and clearing afterwards
would take it with it, dropping a published document out of main's own drafts list.

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
  undefined and is **rejected**: `SchedulePublishButton` renders nothing on a branch and
  `schedulePublishHandler` refuses the request. Rejected rather than branch-scoped because the job runs
  later on a request with no branch, so a branch-aware queueing UI would still publish main's copy.
- **Merged branches leave their version rows behind.** Merging drops the shadow row, but its version
  chain still carries `_branch = <merged branch>` and a `parent` that no longer exists. Invisible to main
  (version reads exclude other branches) and harmless, but it is unreclaimed storage; row 67 covers the
  branch-created case, and the forked case needs the same treatment.
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

> **Never run two adapters concurrently.** `initPayloadInt` writes a generated db-adapter module to disk,
> so two `test:int*` runs with different `PAYLOAD_DATABASE` values overwrite each other's adapter and one
> silently executes against the other's database. Run them in sequence. A failure whose output shows the
> wrong ID shape — ObjectIDs where numbers belong or the reverse — is this, not a real defect.

Collections: `posts` (plain), `pages` (drafts + versions), `media` (upload), `categories` (relationship
and join target), one with a `unique` field, one with `Where`-returning access, one with a **custom text
ID**, one with a **numeric/autoincrement ID**, and one **excluded** via `branching: false`.

### Coverage as of the phase 6 UI work

Roughly half the matrix is covered. The read path, copy-on-write, tombstones, drafts, globals and joins
are in good shape; **merge and hooks is the thinnest area against the highest risk** — 26 rows, about 7
covered. Ranked by what would hurt most, and distinguishing "untested" from "not built":

1. **Untested, implemented, load-bearing.** Row 62's `_rels` cascade — `applyChange` updates a
   branch-created row in place _specifically_ so inbound relationship rows survive, and nothing tests
   that. Also `beforeMerge` / `afterMerge` (58, 59), transaction rollback (60), and version-row
   re-pointing (67).
2. **Zero coverage, separate code paths.** `findDistinct` and `group-by` (row 7) build their own
   queries per adapter; if the predicate is missing there, branch rows leak into main reads.
3. **Not built.** `context.isMerge` / `branch` / `changedBy` (55), validation-on-merge (54),
   unique-collision-as-`blocked` (64, today a raw DB error), discard (47, 48), dependency ordering
   (65, 66), `updateMany` / `deleteMany`.
4. **Unreachable as configured.** `test/branching/config.ts` has no autosave collection (row 33 — and
   autosave is repeated `updateByID` with `draft: true`, which §7's effective-operation logic now
   governs), and `customIDSlug` is exported from `shared.ts` but never added to the config, so the
   custom-text-ID half of row 14 is untested and `numericIDSlug` is only schema-asserted. Rows 13/13a–c
   need extra auth collections. Globals appear in no merge test (24, 28).
5. **Standing `it.todo`s.** Rows 10, 11, 40, 13c — branch resolution across the three APIs, and the
   branching-off regression. Preference-based resolution is exercised only incidentally, by the e2e
   `switchBranch` helper.
6. **e2e is 11 tests**, covering canonical identity, the changed-documents view, and drafts saved from
   the panel. Untested: delete/tombstone from the list view, publishing from the doc view, and the merge
   flow — the last of which cannot be tested yet, since `MergeChangesButton` opens a modal that is not
   built.

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
| 10  | Local API argument, query param, and stored branch preference resolve identically                                                                    |
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

| #   | Behavior                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 29  | Draft saved on a branch is invisible to main `find({ draft: true })`                                                                                                                                 |
| 30  | Publishing on a branch does not publish on main                                                                                                                                                      |
| 31  | `find({ draft: true })` returns the branch draft on the branch, main's draft on main                                                                                                                 |
| 32  | Version history is isolated per branch; main's history is unmodified after a branch edit                                                                                                             |
| 33  | Autosave on a branch writes only to the branch's version chain                                                                                                                                       |
| 34  | ~~Fork copies main's `latest` version, not just the published row~~ — **withdrawn** along with the version-copy design (§7): no version rows are copied, because a branch's history continues main's |
| 34a | Draft-only branch edit merges as a draft — main's published row is byte-identical afterwards, `updatedAt` included                                                                                   |
| 34b | The effective operation for a draft-only edit is `update`, not `publish` (§7)                                                                                                                        |
| 34c | Draft created on a branch merges to main as an unpublished document                                                                                                                                  |

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
