# Content Branching

Editors can work on a copy of production content, see exactly what they changed, and merge it back —
without a staging environment, a duplicate document, or a naming convention.

Branching is to content what git branches are to code, and deliberately not more than that: a branch is a
workspace and a merge is an event. There is no field-level conflict resolution — branch data wins outright.
What replaces reconciliation is _selection_: you choose which changes to merge, and whatever you leave
behind keeps the branch open.

```ts
// Everything below this line happens on a branch. Production never sees it until you merge.
await payload.update({
  id: homepageID,
  branch: 'holiday-campaign',
  collection: 'pages',
  data: { title: 'Happy holidays' },
})
```

## Why this is interesting

**A branch costs one column and no queries when you are not on one.** Branching is not a copy of the
database, a second table, or a plugin that wraps every operation. It is one `_branch` column on the rows
you already have, plus a row per document a branch has touched. A request that names no branch pays
nothing at all: no preference lookup, no manifest read, no predicate. That constraint shaped everything
else — it is why this can live in core.

**A branch is copy-on-write.** Editing a document on a branch forks a shadow row for that branch alone.
Untouched documents are read straight from production, so a branch of a million-document site holds
however many rows you actually edited. Delete a document on a branch and you get a tombstone: gone on the
branch, untouched on production, until you merge.

**Identity is preserved.** A document has one ID everywhere. The shadow row has a primary key of its own,
but nothing outside the database ever sees it — `/admin/collections/pages/123` is the same URL on every
branch, and a relationship pointing at document 123 resolves to whichever copy the current branch should
see.

**Merging is selective and reversible-by-not-doing-it.** Merge 3 of 10 changes and the branch stays open
with the other 7. Every write goes through the ordinary Local API, so hooks, validation and version
creation behave exactly as they would for an edit made by hand on production. Nothing is real until then.

**Permissions are checked where they matter.** Branch writes are permissive on purpose — a branch is a
proposal. The enforcement boundary is the merge, where every change is re-checked against the merging
user's _production_ permissions, per document, and anything they may not write is reported back rather
than silently dropped.

## Local API

Every operation takes an optional `branch`. Omit it and you are on production, exactly as before.

```ts
// Create a document that exists only on this branch
const draft = await payload.create({
  branch: 'holiday-campaign',
  collection: 'pages',
  data: { _status: 'published', title: 'Gift guide' },
})

// Fork an existing production document onto the branch and edit the copy
await payload.update({
  id: homepageID,
  branch: 'holiday-campaign',
  collection: 'pages',
  data: { title: 'Happy holidays' },
})

// Hide a production document from the branch (a tombstone, not a delete)
await payload.delete({
  id: retiredPageID,
  branch: 'holiday-campaign',
  collection: 'pages',
})

// Read the branch's view of the world: its own copies, plus production for everything else
const { docs } = await payload.find({ branch: 'holiday-campaign', collection: 'pages' })

// Production is unaffected throughout
const live = await payload.findByID({ collection: 'pages', id: homepageID })
```

Globals work the same way:

```ts
await payload.updateGlobal({
  branch: 'holiday-campaign',
  data: { navLabel: 'Holiday shop' },
  slug: 'header',
})
```

`branch: false` bypasses branching entirely — the escape hatch for server-side code that means production
regardless of the request it is running inside.

### Merging

```ts
// What would happen, without doing it
const preview = await payload.branches.merge({ branch: 'holiday-campaign', dryRun: true })

preview.mergeable // [{ changeID, collectionSlug, docID, entityType, operation }, …]
preview.blocked // changes this user may not apply to production, each with a reason
preview.warnings // e.g. `main-moved`: production changed after the branch forked

// Apply everything pending
const result = await payload.branches.merge({ branch: 'holiday-campaign' })

// Or apply a subset — the branch stays open with whatever is left
await payload.branches.merge({
  branch: 'holiday-campaign',
  changes: [changeID],
})

// Merge and be done with the branch
await payload.branches.merge({ branch: 'holiday-campaign', closeBranch: true })

// Throw the branch's work away instead, returning those documents to production state
await payload.branches.discard({ branch: 'holiday-campaign' })
```

Merging under the caller's permissions rather than as a trusted server call is one argument:

```ts
await payload.branches.merge({
  branch: 'holiday-campaign',
  overrideAccess: false,
  user,
})
```

`onProgress` is called before each change is applied, and is awaited — a slow consumer throttles the merge
rather than falling behind it. That is what the admin panel's progress bar is built on:

```ts
await payload.branches.merge({
  branch: 'holiday-campaign',
  onProgress: ({ current, docID, total }) => log(`merging ${current} of ${total}: ${docID}`),
})
```

### Scheduling a merge

A `scheduleMerge` task ships with branching, shaped like scheduled publish — a `payload-jobs` row with a
`waitUntil` and the user who queued it, fired by whatever runs your queue:

```ts
await payload.jobs.queue({
  input: { branch: 'holiday-campaign', closeBranch: true, user: user.id },
  task: 'scheduleMerge',
  waitUntil: new Date('2026-12-24T00:00:00Z'),
})
```

The queueing user's permissions are re-resolved and re-checked when the job fires, not when it is queued.
If that account no longer resolves, the job fails rather than falling back to an unchecked merge.

## REST

`branch` is a query parameter, alongside `locale` and `draft`:

```http
GET    /api/pages?branch=holiday-campaign
GET    /api/pages/123?branch=holiday-campaign
PATCH  /api/pages/123?branch=holiday-campaign
DELETE /api/pages/123?branch=holiday-campaign
```

Merge and discard are endpoints on the branch itself:

```http
POST /api/payload-branches/:id/merge
POST /api/payload-branches/:id/discard
```

`merge` accepts `{ changes?, closeBranch?, dryRun?, stream? }` and returns the same shape as the Local
API, responding `403` with `blocked` populated when a merge is fully refused. With `stream: true` it
returns NDJSON — `progress` lines followed by a terminal `complete` or `error` — which is how the panel
narrates a long merge without polling a job.

## GraphQL

`branch` is an argument on generated queries and mutations:

```graphql
query {
  Page(id: "123", branch: "holiday-campaign") {
    title
  }
  Pages(branch: "holiday-campaign") {
    docs {
      id
      title
    }
  }
}

mutation {
  updatePage(id: "123", branch: "holiday-campaign", data: { title: "Happy holidays" }) {
    title
  }
}
```

## Configuration

```ts
export default buildConfig({
  branching: true,
  // …
})
```

That is the whole minimum. Branching applies to every collection and global except auth collections and
Payload's own bookkeeping collections — `payload-jobs`, `payload-preferences`, `payload-locked-documents`,
`payload-migrations`, `payload-query-presets` and the KV collection — which are off by default and opt in
individually with `branching: true` on the collection itself. Anything else can be excluded:

```ts
branching: {
  exclude: ['audit-log'],
  access: {
    createBranch: ({ req }) => Boolean(req.user),
    readBranch: ({ req }) => ({ team: { equals: req.user?.team } }),
  },
  hooks: {
    afterMerge: async ({ branch, results }) => triggerDeploy({ branch, results }),
    beforeMerge: async ({ warnings }) => assertNoFreeze(warnings),
  },
}
```

Three collections are added: `payload-branches` (the branches themselves), `payload-branch-changes` (what
each branch has touched) and `payload-branch-merges` (an append-only ledger of merge events, with a
before/after snapshot per document so history diffs survive the branch's copies being gone).

### Access control

Collection access is unchanged and branch-agnostic, and `req.branch` is in scope inside it — so "editors
may publish on a branch but not on production" is a conditional, not a new primitive:

```ts
access: {
  update: ({ req, data }) =>
    data?._status === 'published' && !req.branch ? isAdmin(req) : isEditor(req),
}
```

There is one thing a document's own rules cannot express: whether this reader should be seeing a proposal
at all. A published document on a branch really is published, so the canonical public rule
`read: () => ({ _status: { equals: 'published' } })` is true of it. Reading or writing _through_ a branch
therefore requires read access to that branch's own document, checked once per request. The default falls
out of Payload's default access — `payload-branches` is admin-only — so **anonymous callers can only ever
read production, with no configuration at all.**

## Admin panel

**A branch switcher in the app header**, left of the breadcrumbs, styled like the list view's Columns /
Group by / Filters controls. It reads as a scope control rather than a location, because that is what it
is: everything to its right is scoped to the branch it names. It lists `main` plus every branch the user
can read, tagging those that are merged or have a merge queued, above two pinned actions — "Manage
branches…" and "Create new branch", which opens a modal (a name and a description; the slug is derived)
whose primary action is "Create and switch".

The selection lives in the user's `admin` preference, so it follows them between browsers and machines,
and it is threaded onto admin API calls as an explicit argument the way `locale` is.

**Everything else in the panel just works, scoped.** Lists, edit views, drafts, version history, the API
tab, publish and save-draft, bulk edit and delete — all read and write the active branch, and a document
keeps the same URL on every branch.

**A review view per branch**, at the branch's own edit route, listing every document the branch changed:
one collapsible row each with a Created / Updated / Deleted pill, expandable to a field-level diff against
production — the same renderer version comparison uses, showing only what changed. Changed globals appear
in the same list. Rows are selectable, and the selection drives both actions:

- **Merge** opens one modal from anywhere the action exists. It states what will be applied ("Changes to 2
  Posts and 1 Header"), offers merge-now or schedule-for-later, and offers to close the branch when
  nothing would be left behind. Merging now streams progress — "merging 34 of 230" — and holds the
  completed state open as a receipt rather than flickering shut.
- **Discard** returns the selected documents to production state.

**Below the current changes, the branch's history**: one section per merge event, paginated, each listing
what it applied and diffing it from the ledger's stored snapshots — so a merged change is still
inspectable long after the branch's copy of it is gone.

**A queued merge is visible where the branch is**: a banner on the review view naming the date, the
documents it will apply expandable underneath it, a "Scheduled to merge" tag in the switcher, and
cancel-or-schedule-another in one modal. Several schedules can coexist, because scheduling does not end a
branch.

**Merging does not end a branch either.** A branch with nothing pending is `merged` and still workable —
record a change on it and it is open again. `closed` is the terminal state, and only a caller who asked
for it gets one; a closed branch refuses writes and keeps its history as a record.

## What it costs when you are not using it

Nothing measurable. With `branching` unset, no fields are injected, no predicate is applied, no
collections are added, and every query is byte-identical to what it was. With branching enabled but the
request on production, the cost is one `_branch = 'main'` term in the queries you were already running.

## Status

See `CONTENT_BRANCHING_PLAN.md` for what is implemented, what is not, and the known limitations.
