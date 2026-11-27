import type { CollectionConfig } from 'payload'

import { mediaClientSlug } from '../shared.js'

export const MediaClient: CollectionConfig = {
  slug: mediaClientSlug,
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
