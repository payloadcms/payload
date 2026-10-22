import type { CollectionConfig } from 'payload'

import { resizedMediaSlug } from '../../shared.js'

export const ResizedMedia: CollectionConfig = {
  slug: resizedMediaSlug,
  fields: [],
  upload: { resizeOptions: { height: 10, width: 10 } },
}
