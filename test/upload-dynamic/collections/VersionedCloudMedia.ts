import type { CollectionConfig } from 'payload'

import { versionedCloudMediaSlug } from '../shared.js'
import { PublicCloudMedia } from './PublicCloudMedia.js'

export const VersionedCloudMedia: CollectionConfig = {
  ...PublicCloudMedia,
  slug: versionedCloudMediaSlug,
  access: { ...PublicCloudMedia.access, readVersions: () => true },
  fields: [
    { name: 'alt', type: 'text', localized: true },
    { name: 'storageMarker', type: 'text' },
  ],
  versions: { drafts: true },
}
