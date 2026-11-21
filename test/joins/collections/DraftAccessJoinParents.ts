import type { CollectionConfig } from 'payload'

import { draftAccessJoinDocsSlug, draftAccessJoinParentsSlug } from '../shared.js'

export const DraftAccessJoinParents: CollectionConfig = {
  slug: draftAccessJoinParentsSlug,
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'documents',
      type: 'join',
      collection: draftAccessJoinDocsSlug,
      on: 'parent',
    },
  ],
}
