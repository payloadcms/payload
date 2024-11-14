import type { CollectionConfig } from 'payload'

import { collectionSlugs } from '../../shared.js'

export const ValidateDraftsOn: CollectionConfig = {
  slug: collectionSlugs.validateDraftsOn,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: {
      validate: true,
    },
  },
}
