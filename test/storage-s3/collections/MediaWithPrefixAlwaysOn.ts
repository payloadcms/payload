import type { CollectionConfig } from 'payload'

import { mediaWithPrefixAlwaysOnSlug } from '../shared.js'

export const MediaWithPrefixAlwaysOn: CollectionConfig = {
  slug: mediaWithPrefixAlwaysOnSlug,
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
