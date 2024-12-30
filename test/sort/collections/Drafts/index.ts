import type { CollectionConfig } from 'payload'

export const draftsSlug = 'drafts'

export const DraftsCollection: CollectionConfig = {
  slug: draftsSlug,
  admin: {
    useAsTitle: 'text',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'number',
      type: 'number',
    },
    {
      name: 'number2',
      type: 'number',
    },
  ],
}
