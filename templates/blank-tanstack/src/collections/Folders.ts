import type { CollectionConfig } from 'payload'

export const Folders: CollectionConfig = {
  slug: 'folders',
  admin: {
    useAsTitle: 'name',
  },
  folders: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
