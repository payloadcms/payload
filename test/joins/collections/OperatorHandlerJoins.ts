import type { CollectionConfig } from 'payload'

import {
  operatorHandlerJoinArticlesSlug,
  operatorHandlerJoinNotesSlug,
  operatorHandlerJoinParentsSlug,
} from '../shared.js'

const createCaseInsensitiveSetting = (enabled: boolean) => () => enabled

const operatorHandlerAccess: CollectionConfig['access'] = {
  read: ({ req }) => {
    if (req.context.useOperatorHandlerIDAccessConstraint) {
      return { id: { not_like: req.context.excludedChildID } }
    }

    if (req.context.useFieldSpecificOperatorHandlerAccessConstraint) {
      return { title: { not_equals: 'blocked' } }
    }

    return true
  },
}

export const OperatorHandlerJoinArticles: CollectionConfig = {
  slug: operatorHandlerJoinArticlesSlug,
  access: operatorHandlerAccess,
  fields: [
    {
      name: 'id',
      type: 'text',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: operatorHandlerJoinParentsSlug,
    },
    {
      name: 'title',
      type: 'text',
      custom: {
        useCaseInsensitiveComparison: createCaseInsensitiveSetting(false),
      },
    },
  ],
  versions: false,
}

export const OperatorHandlerJoinNotes: CollectionConfig = {
  slug: operatorHandlerJoinNotesSlug,
  access: operatorHandlerAccess,
  fields: [
    {
      name: 'id',
      type: 'text',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: operatorHandlerJoinParentsSlug,
    },
    {
      name: 'title',
      type: 'text',
      custom: {
        useCaseInsensitiveComparison: createCaseInsensitiveSetting(true),
      },
    },
  ],
  versions: false,
}

export const OperatorHandlerJoinParents: CollectionConfig = {
  slug: operatorHandlerJoinParentsSlug,
  fields: [
    {
      name: 'children',
      type: 'join',
      collection: [operatorHandlerJoinArticlesSlug, operatorHandlerJoinNotesSlug],
      on: 'parent',
    },
  ],
  versions: false,
}
