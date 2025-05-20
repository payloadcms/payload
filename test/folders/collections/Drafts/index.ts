import type { CollectionConfig } from 'payload'

export const Drafts: CollectionConfig = {
  slug: 'drafts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
