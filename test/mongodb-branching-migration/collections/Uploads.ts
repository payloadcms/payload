import type { CollectionConfig } from 'payload'

import { uploadsSlug } from '../shared.js'

export const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  fields: [{ name: '_branch', type: 'text' }],
  upload: {
    disableLocalStorage: true,
    filenameCompoundIndex: ['filename', '_branch'],
  },
}
