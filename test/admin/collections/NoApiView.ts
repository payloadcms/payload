import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { noApiViewCollection } from '../shared'

export const CollectionNoApiView: CollectionConfig = {
  slug: noApiViewCollection,
  admin: {
    hideAPIURL: true,
  },
  fields: [],
}
