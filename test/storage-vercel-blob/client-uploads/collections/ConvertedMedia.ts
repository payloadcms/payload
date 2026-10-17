import type { CollectionConfig } from 'payload'

import { convertedMediaSlug } from '../shared.js'

export const ConvertedMedia: CollectionConfig = {
  slug: convertedMediaSlug,
  fields: [],
  upload: {
    formatOptions: { format: 'webp' },
    imageSizes: [{ name: 'square', height: 20, width: 30 }],
    resizeOptions: { height: 200, width: 200 },
  },
}
