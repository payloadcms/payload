import type { CollectionConfig } from 'payload'

import { slugs } from '../../shared.js'

export const ValidateDraftsOn: CollectionConfig = {
  slug: slugs.validateDraftsOn,
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
