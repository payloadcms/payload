import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

import { noApiViewCollectionSlug } from '../slugs.js'

export const CollectionNoApiView: CollectionConfig = {
  slug: noApiViewCollectionSlug,
  admin: {
    hideAPIURL: true,
  },
  fields: [],
}
