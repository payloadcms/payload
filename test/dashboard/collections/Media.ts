import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Dashboard Data',
  },
  defaultPopulate: { filename: true },
  fields: [],
  upload: {
    mimeTypes: ['image/*'],
  },
}
