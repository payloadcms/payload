import type { CollectionConfig } from 'payload'

export const Drafts: CollectionConfig = {
  slug: 'drafts',
  admin: {
    useAsTitle: 'title',
  },
  folders: true,
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
