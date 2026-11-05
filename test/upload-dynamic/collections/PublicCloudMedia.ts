import type { CollectionConfig } from 'payload'

import { publicCloudMediaSlug } from '../shared.js'

export const PublicCloudMedia: CollectionConfig = {
  slug: publicCloudMediaSlug,
  access: { create: () => true, read: () => true, update: () => true },
  fields: [],
  // Files with the same name can exist in different folders.
  upload: { filenameCompoundIndex: ['filename', 'prefix'] },
}
