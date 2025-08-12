import type { CollectionConfig } from 'payload'

import { fileMimeTypeSlug } from '../../shared.js'

export const FileMimeType: CollectionConfig = {
  slug: fileMimeTypeSlug,
  admin: {
    useAsTitle: 'title',
  },
  upload: {
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      type: 'text',
      name: 'title',
    },
  ],
}
