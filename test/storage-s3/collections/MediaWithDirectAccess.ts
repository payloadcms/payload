import type { CollectionConfig } from 'payload'

export const MediaWithDirectAccess: CollectionConfig = {
  slug: 'media-with-direct-access',
  upload: {
    disableLocalStorage: true,
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        crop: 'center',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
    },
  ],
}
