import type { CollectionConfig } from 'payload'

import { versionedPublicCloudMediaSlug } from '../shared.js'

export const VersionedPublicCloudMedia: CollectionConfig = {
  slug: versionedPublicCloudMediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [],
  upload: {},
  versions: true,
}
