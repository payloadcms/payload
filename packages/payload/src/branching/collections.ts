import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { CollectionAfterChangeHook, PayloadRequest } from '../index.js'
import type { SanitizedBranchingConfig } from './types.js'

import { defaultAccess } from '../auth/defaultAccess.js'
import { wrapInternalEndpoints } from '../utilities/wrapInternalEndpoints.js'
import { discardBranchHandler } from './endpoints/discard.js'
import { mergeBranchHandler } from './endpoints/merge.js'
import { loadBranchRow, setBranchRow } from './resolveBranch.js'
import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
  MAIN_BRANCH,
} from './types.js'

export const getBranchesCollection = (branching: SanitizedBranchingConfig): CollectionConfig => ({
  slug: branchesCollectionSlug,
  access: {
    create: branching.access?.createBranch ?? defaultAccess,
    delete: defaultAccess,
    read: branching.access?.readBranch ?? defaultAccess,
    update: defaultAccess,
  },
  admin: {
    defaultColumns: ['name', 'slug', 'status', 'updatedAt'],
    // Reached only through the branch switcher in the app header, never from the
    // nav or the dashboard: branches are a scope control, not a content type.
    hidden: true,
    useAsTitle: 'name',
  },
  labels: {
    plural: ({ t }) => t('branching:branches'),
    singular: ({ t }) => t('branching:branch'),
  },
  // Deleting a branch drops its shadow rows, and dropping a branch-created
  // document cascade-deletes every inbound `_rels` row pointing at it — from
  // main documents too. That is not something to offer behind a multi-select.
  disableBulkDelete: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      // Payload's own slug field: it derives from `name`, slugifies, dedupes
      // against existing branches, and defaults to `required`, `unique` and
      // `index`. Read-only because editors name a branch; the slug follows.
      name: 'slug',
      type: 'slug',
      admin: { readOnly: true },
      hooks: {
        // Sanitization appends custom hooks after the generator, so this has the
        // last word. Immutable after create: `_branch` stores the slug rather than
        // a foreign key, so renaming it would orphan every shadow row — and the
        // generator lets an explicit value from the client win, which is exactly
        // what must not happen here.
        beforeChange: [
          ({ operation, originalDoc, value }) =>
            operation === 'create' ? value : ((originalDoc as { slug?: string })?.slug ?? value),
        ],
      },
      useAsSlug: 'name',
      // Permits empty deliberately: the generator populates the slug in
      // `beforeChange`, which runs after validation.
      validate: (value: unknown) =>
        value === MAIN_BRANCH ? `"${MAIN_BRANCH}" is a reserved branch name.` : true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        // Rendered as a status pill rather than a raw lowercase value: a branch's
        // status answers the same question a document's draft/published status
        // does, and the list view already has a visual language for that.
        components: { Cell: '@payloadcms/ui#BranchStatusCell' },
        readOnly: true,
      },
      defaultValue: 'open',
      index: true,
      options: [
        { label: ({ t }) => t('branching:status_open'), value: 'open' },
        { label: ({ t }) => t('branching:status_merging'), value: 'merging' },
        { label: ({ t }) => t('branching:status_merged'), value: 'merged' },
        { label: ({ t }) => t('branching:status_closed'), value: 'closed' },
      ],
    },
    {
      name: 'mergedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      // `"12/230"` while a scheduled merge is running, null otherwise.
      //
      // Lives here rather than on the job because it describes the branch, and
      // because whoever wants it is looking at the branch. Written by the task at
      // roughly twenty points regardless of branch size: an interactive merge streams
      // its progress to the client that asked for it, so this exists only for the
      // scheduled case, where nobody is holding a connection.
      name: 'mergeProgress',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
  ],
  // Wrapped so the POST body is parsed onto `req.data`, as with every other
  // built-in endpoint.
  endpoints: wrapInternalEndpoints([
    {
      handler: mergeBranchHandler,
      method: 'post',
      path: '/:id/merge',
    },
    {
      handler: discardBranchHandler,
      method: 'post',
      path: '/:id/discard',
    },
  ]),
  // `slug` is immutable after creation: `_branch` stores the slug rather than
  // a foreign key, so renaming it would orphan every shadow row.
  lockDocuments: false,
  // Payload 4 enables versions by default, and a branch record is bookkeeping —
  // a name, a description, a status. Its history is noise, and leaving the default
  // in place costs every install an extra table. Matches every other core
  // collection.
  versions: false,
})

export const getBranchChangesCollection = (config: Config): CollectionConfig => {
  const branching = config.branching as SanitizedBranchingConfig

  const branchable = [...branching.branchableCollections]

  return {
    slug: branchChangesCollectionSlug,
    access: {
      create: defaultAccess,
      delete: defaultAccess,
      read: defaultAccess,
      update: defaultAccess,
    },
    admin: {
      hidden: true,
    },
    fields: [
      {
        name: 'branch',
        type: 'text',
        index: true,
        required: true,
      },
      {
        name: 'entityType',
        type: 'select',
        defaultValue: 'collection',
        options: ['collection', 'global'],
      },
      {
        name: 'collectionSlug',
        type: 'text',
        index: true,
      },
      {
        name: 'globalSlug',
        type: 'text',
        index: true,
      },
      // Polymorphic so it spans collections with different ID types —
      // auto-increment integers, custom text IDs, ObjectIDs — without a
      // coercion step that would fail open by silently matching nothing.
      ...(branchable.length
        ? ([
            {
              name: 'doc',
              type: 'relationship',
              index: true,
              maxDepth: 0,
              relationTo: branchable,
            },
          ] as CollectionConfig['fields'])
        : []),
      {
        name: 'operation',
        type: 'select',
        options: ['create', 'update', 'delete'],
        required: true,
      },
      {
        name: 'baseUpdatedAt',
        type: 'date',
      },
      {
        name: 'baseVersionID',
        type: 'text',
      },
    ],
    hooks: {
      // A branch marked `merged` had nothing pending. Recording a new change means
      // it does again, so the label goes back to what is true. Without this, work
      // resumed on a merged branch would be invisible: `merged` branches are
      // filtered out of the switcher, so the branch would hold pending changes
      // nobody could navigate to.
      afterChange: [reopenBranchOnChange],
    },
    indexes: [{ fields: ['branch', 'collectionSlug'], unique: false }],
    lockDocuments: false,
    // Registry rows are derived state; versioning them is meaningless.
    versions: false,
  }
}

/**
 * The merge ledger: what each merge event applied, and when.
 *
 * Append-only and read by nobody in the write path, which is the point — it costs
 * the read predicate nothing, unlike retaining consumed change rows and filtering
 * them out of the manifest query on every request.
 */
export const getBranchMergesCollection = (): CollectionConfig => ({
  slug: branchMergesCollectionSlug,
  access: {
    create: defaultAccess,
    // Append-only: a ledger that can be edited is not a ledger. Deletion is
    // permitted so that deleting a branch can take its history with it.
    delete: defaultAccess,
    read: defaultAccess,
    update: () => false,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'branch',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'mergedAt',
      type: 'date',
      required: true,
    },
    // Stored rather than related: the ledger has to keep reading correctly after
    // the user is deleted, and after they are renamed.
    {
      name: 'mergedByID',
      type: 'text',
    },
    {
      name: 'mergedByLabel',
      type: 'text',
    },
    {
      // Snapshotted per change, for the same reason. A document merged under one
      // title and renamed afterwards was merged under the title it had.
      name: 'changes',
      type: 'array',
      fields: [
        { name: 'collectionSlug', type: 'text' },
        { name: 'docID', type: 'text' },
        { name: 'docTitle', type: 'text' },
        /** Set instead of `collectionSlug`/`docID` when the merged change was a global. */
        { name: 'globalSlug', type: 'text' },
        { name: 'operation', type: 'text' },
        // Both sides of the change, captured either side of the write.
        //
        // Without these the archive can only list what was merged: the branch's copy
        // is dropped by the merge and main then holds the merged values on the only
        // row that exists, so there is no second state left to diff against. Storing
        // them is the price of a history that can still answer "what changed?" —
        // taken *after* the write for `after`, so hook-derived fields are included
        // and the diff shows what main really received.
        { name: 'before', type: 'json' },
        { name: 'after', type: 'json' },
      ],
    },
  ],
  indexes: [{ fields: ['branch', 'mergedAt'], unique: false }],
  lockDocuments: false,
  versions: false,
})

/** Returns a `merged` branch to `open` as soon as it has a pending change again. */
const reopenBranchOnChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc
  }

  const branch = (doc as { branch?: string }).branch

  if (!branch) {
    return doc
  }

  // The same row `assertBranchWritable` just read, rather than a query of its own: this
  // hook fires on every first touch of a document, and the answer is almost always "not
  // merged, nothing to do".
  const row = await loadBranchRow({ branch, req })

  if (row?.status === 'merged') {
    const reopened = await req.payload.update({
      id: row.id as number | string,
      collection: branchesCollectionSlug,
      data: { mergedAt: null, status: 'open' },
      overrideAccess: true,
      req,
    })

    setBranchRow({ branch, req, row: reopened as Record<string, unknown> })
  }

  return doc
}
