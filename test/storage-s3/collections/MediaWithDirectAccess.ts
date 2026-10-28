import type { CollectionConfig } from 'payload'

export const MediaWithDirectAccess: CollectionConfig = {
  slug: 'media-with-direct-access',
  upload: {
    disableLocalStorage: true,
    adminThumbnail: 'thumbnail',
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
