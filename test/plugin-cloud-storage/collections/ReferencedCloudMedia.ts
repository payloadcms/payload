import type { CollectionConfig } from 'payload'

import { referencedCloudMediaSlug } from '../shared.js'

export const ReferencedCloudMedia: CollectionConfig = {
  slug: referencedCloudMediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [],
  upload: {},
  versions: true,
}
