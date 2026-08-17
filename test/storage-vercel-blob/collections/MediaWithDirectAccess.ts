import type { CollectionConfig } from 'payload'

import { mediaWithDirectAccessSlug } from '../shared.js'

export const MediaWithDirectAccess: CollectionConfig = {
  slug: mediaWithDirectAccessSlug,
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
