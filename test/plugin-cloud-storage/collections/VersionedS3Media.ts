import type { CollectionConfig } from 'payload'

import { versionedS3MediaSlug } from '../shared.js'

export const VersionedS3Media: CollectionConfig = {
  slug: versionedS3MediaSlug,
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
