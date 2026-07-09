import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: true,
  versions: false,
}
