import type { CollectionConfig } from 'payload'

import { mediaWithDirectAccessSlug } from '../shared.js'

export const MediaWithDirectAccess: CollectionConfig = {
  slug: mediaWithDirectAccessSlug,
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
