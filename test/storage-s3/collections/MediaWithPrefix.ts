import type { CollectionConfig } from 'payload'

export const MediaWithPrefix: CollectionConfig = {
  slug: 'media-with-prefix',
  upload: {
    disableLocalStorage: false,
    filenameCompoundIndex: true,
  },
  fields: [
    {
      name: 'prefix',
      type: 'text',
    },
  ],
}
