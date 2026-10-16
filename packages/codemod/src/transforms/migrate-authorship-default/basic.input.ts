import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [],
  upload: true,
}
