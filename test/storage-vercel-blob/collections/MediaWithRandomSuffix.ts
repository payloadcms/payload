import type { CollectionConfig } from 'payload'

import { mediaWithRandomSuffixSlug } from '../shared.js'

export const MediaWithRandomSuffix: CollectionConfig = {
  slug: mediaWithRandomSuffixSlug,
  fields: [],
  upload: {
    imageSizes: [
      {
        name: 'square',
        height: 400,
        width: 400,
      },
    ],
  },
}
