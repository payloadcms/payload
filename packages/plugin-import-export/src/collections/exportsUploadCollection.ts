import type { CollectionConfig } from 'payload'

import { exportsUploadsCollectionSlug } from '../constants.js'

export const exportsUploadsCollection: CollectionConfig = {
  slug: exportsUploadsCollectionSlug,
  admin: {
    hidden: true,
  },
  endpoints: false,
  fields: [],
  graphQL: false,
  upload: true,
}
