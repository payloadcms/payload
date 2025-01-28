import type { CollectionConfig } from 'payload'

import { mediaCollectionSlug } from '../slugs.js'

export const Media: CollectionConfig = {
  fields: [],
  slug: mediaCollectionSlug,
  upload: true,
}
