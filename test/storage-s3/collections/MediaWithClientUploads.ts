import type { CollectionConfig } from 'payload'

export const MediaWithClientUploads: CollectionConfig = {
  slug: 'media-with-client-uploads',
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
  ],
  upload: {
    disableLocalStorage: true,
  },
}
