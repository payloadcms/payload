import type { CollectionConfig } from 'payload'

export const Autosave: CollectionConfig = {
  slug: 'autosave',
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
    drafts: {
      autosave: true,
    },
  },
}
