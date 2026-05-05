import type { CollectionConfig } from 'payload'

import { mediaWithDocPrefixSlug } from '../shared.js'

export const MediaWithDocPrefix: CollectionConfig = {
  slug: mediaWithDocPrefixSlug,
  upload: {
    filenameCompoundIndex: ['prefix', 'filename'],
  },
  fields: [
    {
      name: 'prefix',
      type: 'text',
      defaultValue: () => `doc-${Math.random().toString(36).slice(2, 10)}`,
    },
  ],
}
