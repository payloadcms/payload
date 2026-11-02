import type { CollectionConfig } from 'payload'

export const MediaClient: CollectionConfig = {
  slug: 'media-client',
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
  versions: false,
}
