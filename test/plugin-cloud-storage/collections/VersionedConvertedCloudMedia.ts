import type { CollectionConfig } from 'payload'

import { versionedConvertedCloudMediaSlug } from '../shared.js'

export const VersionedConvertedCloudMedia: CollectionConfig = {
  slug: versionedConvertedCloudMediaSlug,
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
