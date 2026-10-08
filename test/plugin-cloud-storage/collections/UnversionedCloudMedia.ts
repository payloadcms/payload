import type { CollectionConfig } from 'payload'

import { unversionedCloudMediaSlug } from '../shared.js'
import { versionedCloudFailure } from '../versionedCloudStorage.js'

export const UnversionedCloudMedia: CollectionConfig = {
  slug: unversionedCloudMediaSlug,
  access: { create: () => true, read: () => true, update: () => true },
  fields: [],
  hooks: {
    afterChange: [
      () => {
        if (versionedCloudFailure.afterChange) {
          throw new Error('Cloud test afterChange failed')
        }
      },
    ],
  },
  upload: {},
  versions: false,
}
