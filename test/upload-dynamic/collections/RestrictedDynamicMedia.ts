import type { CollectionConfig } from 'payload'

import { restrictedDynamicMediaDir, restrictedDynamicMediaSlug } from '../shared.js'
import { DynamicMedia } from './DynamicMedia.js'

/** Limits uploads to images, to check that request-time variants still save. */
export const RestrictedDynamicMedia: CollectionConfig = {
  ...DynamicMedia,
  slug: restrictedDynamicMediaSlug,
  upload: {
    ...(typeof DynamicMedia.upload === 'object' ? DynamicMedia.upload : {}),
    mimeTypes: ['image/*'],
    staticDir: restrictedDynamicMediaDir,
  },
}
