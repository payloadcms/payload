import type { CollectionConfig } from 'payload'

export const MediaContainer: CollectionConfig = {
  slug: 'media-container',
  fields: [
    {
      name: 'files',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
  ],
}
