import type { CollectionConfig } from 'payload'

import { mediaWithOverwriteSlug } from '../shared.js'

export const MediaWithOverwrite: CollectionConfig = {
  slug: mediaWithOverwriteSlug,
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
