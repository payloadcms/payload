import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    enableFolders: {
      debug: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
