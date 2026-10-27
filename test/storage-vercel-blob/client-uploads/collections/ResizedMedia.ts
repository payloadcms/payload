import type { CollectionConfig } from 'payload'

import { resizedMediaSlug } from '../../shared.js'

export const ResizedMedia: CollectionConfig = {
  slug: resizedMediaSlug,
  fields: [],
  upload: {
    imageSizes: [{ name: 'thumbnail', height: 5, width: 5 }],
    resizeOptions: { height: 10, width: 10 },
  },
}
