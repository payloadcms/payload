import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Dashboard Data',
  },
  fields: [],
  upload: {
    mimeTypes: ['image/*'],
  },
}
