import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { SanitizedBranchingConfig } from './types.js'

import { defaultAccess } from '../auth/defaultAccess.js'
import { wrapInternalEndpoints } from '../utilities/wrapInternalEndpoints.js'
import { mergeBranchHandler } from './endpoints/merge.js'
import { branchChangesCollectionSlug, branchesCollectionSlug, MAIN_BRANCH } from './types.js'

export const getBranchesCollection = (branching: SanitizedBranchingConfig): CollectionConfig => ({
  slug: branchesCollectionSlug,
  access: {
    create: branching.access?.createBranch ?? defaultAccess,
    delete: defaultAccess,
    read: branching.access?.readBranch ?? defaultAccess,
    update: defaultAccess,
  },
  admin: {
    hidden: true,
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: { readOnly: true },
      index: true,
      required: true,
      unique: true,
      validate: (value: unknown) =>
        value === MAIN_BRANCH ? `"${MAIN_BRANCH}" is a reserved branch name.` : true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      index: true,
      options: ['open', 'merging', 'merged', 'closed'],
    },
    {
      name: 'mergedAt',
      type: 'date',
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
  ]),
  // `slug` is immutable after creation: `_branch` stores the slug rather than
  // a foreign key, so renaming it would orphan every shadow row.
  lockDocuments: false,
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
    indexes: [{ fields: ['branch', 'collectionSlug'], unique: false }],
    lockDocuments: false,
  }
}
