import type { CollectionConfig } from 'payload'

export const MediaWithDirectAccess: CollectionConfig = {
  slug: 'media-with-direct-access',
  upload: {
    disableLocalStorage: true,
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
    },
  ],
}
