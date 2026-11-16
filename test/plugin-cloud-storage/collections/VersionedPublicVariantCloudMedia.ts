import type { CollectionConfig } from 'payload'

import { versionedPublicVariantCloudMediaSlug } from '../shared.js'

export const VersionedPublicVariantCloudMedia: CollectionConfig = {
  slug: versionedPublicVariantCloudMediaSlug,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [],
  upload: {},
  versions: true,
}
