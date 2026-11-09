import type { CollectionConfig } from 'payload'

import { versionedDynamicMediaDir, versionedDynamicMediaSlug } from '../shared.js'
import { DynamicMedia } from './DynamicMedia.js'

export const VersionedDynamicMedia: CollectionConfig = {
  ...DynamicMedia,
  slug: versionedDynamicMediaSlug,
  access: {
    ...DynamicMedia.access,
    readVersions: () => true,
  },
  fields: [{ name: 'alt', type: 'text', localized: true }],
  upload: {
    ...(typeof DynamicMedia.upload === 'object' ? DynamicMedia.upload : {}),
    staticDir: versionedDynamicMediaDir,
  },
  trash: true,
  versions: { drafts: true },
}
