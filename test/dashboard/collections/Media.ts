import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Dashboard Data',
  },
  defaultPopulate: { filename: true },
  fields: [
    {
      name: 'previewURL',
      type: 'text',
    },
  ],
  upload: {
    adminThumbnail: ({ doc }) => doc.previewURL,
    mimeTypes: ['image/*'],
  },
}
