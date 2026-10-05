import type { CollectionConfig } from 'payload'

export const MediaAlt: CollectionConfig = {
  slug: 'media-alt',
  admin: {
    group: 'Dashboard Data',
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      required: true,
    },
  ],
  labels: {
    plural: 'Media Alts',
    singular: 'Media Alt',
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
