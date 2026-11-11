Written with AI

# Payload Content Branching Reference

Content Branching is experimental. It lets editors prepare and review a set of content changes
before merging them into `main`. Configuration, APIs, and behavior may change in minor releases.
For the complete user guide, see [Content Branching](https://payloadcms.com/docs/branching/overview).

## Enable branching

Add `branching` to your existing Payload Config:

```ts
import { buildConfig } from 'payload'

export default buildConfig({
  // Keep your existing database, secret, collections, and other options.
  branching: true,
})
```

Eligible collections and globals participate by default. To keep content shared across all branches,
set `branching: false` on that collection or global, or use the root object form:

```ts
branching: {
  exclude: ['audit-events', 'settings'],
}
```

Root exclusions take precedence over entity-level `branching: true`. Auth-enabled collections cannot
branch. Internal collections are excluded by default. Collections with custom `id` fields and
`@payloadcms/plugin-multi-tenant` are unsupported.

Before deployment, review and run database migrations. SQL adapters use normal generated schema
migrations. Existing MongoDB databases need the predefined branching migration to backfill branch
identities and update indexes; schema defaults do not rewrite existing documents. See
[adapter migration commands](ADAPTERS.md#content-branching-migrations). Run `payload generate:types`
with your project's package manager after changing the config.

## Editor workflow

1. Create a named branch from the Admin Panel branch switcher and select it.
2. Edit collections and globals as usual. Branch writes, deletes, uploads, and Trash changes stay
   isolated from `main` for participating entities.
3. Review pending changes and merge warnings. Merge selected changes, merge all pending changes,
   or discard work that should not reach `main`.
4. Switch to `main` to check the result. Merging keeps the branch available by default; closing it
   prevents further edits and merges.

Branches inherit the **current** `main` document until that document changes on the branch. After
that, reads use the branch-owned state. Branch creation does not freeze a snapshot. Documents keep
their logical IDs, so relationships continue to use the same IDs.

Names are unique and immutable; `main` is reserved. Branch names select content through APIs;
branch record IDs identify the lifecycle REST endpoints.

## Create a branch and edit content

The following examples assume branching is enabled, `pages` is a participating collection, and
`user` is the authenticated user. Create branches through the `payload-branches` collection;
there is no `payload.branches.create` method.

```ts
const branch = await payload.create({
  collection: 'payload-branches',
  data: { name: 'fall-campaign' },
  overrideAccess: false,
  user,
})

const page = await payload.findByID({
  branch: branch.name,
  collection: 'pages',
  id: pageID,
  overrideAccess: false,
  user,
})

await payload.update({
  branch: branch.name,
  collection: 'pages',
  id: page.id,
  data: { title: 'Fall campaign' },
  overrideAccess: false,
  user,
})
```

Supported Local API operations inherit `req.branch` unless `branch` is explicitly provided,
falling back to `main` when neither is present. Pass `branch: 'main'` to explicitly query main.
Pass `req` to nested operations in hooks so they preserve branch and transaction context.

REST uses `?branch=fall-campaign`; GraphQL uses a `branch` argument on the query or mutation field.
URL-encode branch names. Nested relationship and join reads use the same branch.

## Permissions and previews

Branch lifecycle permissions live in `branching.access`: `createBranch`, `readBranch`,
`updateBranch`, `deleteBranch`, `mergeBranch`, and `discardBranch`. By default, branch access is
limited to authenticated users from `admin.user`; `mergeBranch` falls back to `readBranch`, and
`discardBranch` falls back to `deleteBranch`. Set explicit action permissions if readers should
not merge or discard.

Branch access supplements normal collection, global, and field access. User-facing Local API
operations must pass `user` and `overrideAccess: false`, including merge and discard. Existing
access functions can use `req.branch` for branch-specific rules.

Preview and Live Preview URL callbacks receive `req.branch`. Include that branch in the preview
URL, authenticate the frontend preview request, and query Payload with the same `branch`, `user`,
and `overrideAccess: false`. Selecting a branch in Admin does not automatically select it in your
frontend queries. Preserve `draft: true` as well when the preview needs unpublished drafts.

## Merge and discard

Preview the proposed merge before applying it:

```ts
const preview = await payload.branches.merge({
  branch: 'fall-campaign',
  dryRun: true,
  overrideAccess: false,
  user,
})
```

Inspect `canMerge`, `blocked`, `validationErrors`, and `warnings`. `canMerge` means at least one
selected change can be applied, not that every selected change passed. After reviewing the result,
perform the merge:

```ts
const result = await payload.branches.merge({
  branch: 'fall-campaign',
  overrideAccess: false,
  user,
})
```

- Omit `changes` to merge all pending work. Supply branch-change record IDs to merge a subset.
- All merges target `main`. The latest branch state wins; there is no branch-to-branch merge,
  three-way reconciliation, or field-level conflict resolution. Review warnings about overwritten
  changes on `main`.
- Draft/published state is preserved. Merging a draft does not publish it; an existing published
  document keeps its published content while its draft is updated.
- Normal target access, validation, hooks, and unique constraints run again. A successful dry run
  does not guarantee that the real write will succeed.
- Use `closeBranch: true` to make a branch terminal after all remaining work is merged. Otherwise,
  the branch stays available; new edits reopen a fully merged branch.

Discard unwanted work with `payload.branches.discard({ branch: 'fall-campaign', overrideAccess: false,
user })`. It also accepts `changes` for a selected subset; omitting it discards all pending changes.
Discard removes branch-owned work without changing `main`. References from surviving content or
versions can prevent discarding branch-created documents.

For REST, use `POST /api/payload-branches/:id/merge` or
`POST /api/payload-branches/:id/discard` with the **branch record ID**.

## Scheduling and failed merges

With the Jobs Queue configured, editors can schedule merges in Admin. A scheduled merge uses
current content and repeats permissions when it runs as the stored user; scheduling does not
freeze content or guarantee execution. Without a selected subset, it includes changes added
before execution.

Transaction-free merges do not guarantee atomic visibility or recovery: an earlier write may
already be visible on `main` when a later write fails. Review merge history and logs after failures.
Version retention affects history and recovery; unversioned content has no guaranteed recovery.
If target writes committed but source cleanup failed, those writes remain applied; retrying the
merge retries cleanup without repeating committed writes. Do not assume a failure means `main`
is unchanged.
