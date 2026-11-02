import type { CollectionConfig } from 'payload'

import { versionedCloudMediaSlug } from '../shared.js'
import { versionedCloudCalls, versionedCloudFailure } from '../versionedCloudStorage.js'

export const VersionedCloudMedia: CollectionConfig = {
  slug: versionedCloudMediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [{ name: 'storageMarker', type: 'text' }],
  hooks: {
    afterChange: [
      () => {
        versionedCloudCalls.afterChanges += 1
        if (versionedCloudFailure.afterChange) {
          throw new Error('Cloud test afterChange failed')
        }
      },
    ],
  },
  upload: {},
  versions: { drafts: true },
}
