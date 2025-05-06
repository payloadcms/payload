import type { CollectionConfig } from 'payload'

import { mediaWithSignedDownloadsSlug } from '../shared.js'

export const MediaWithSignedDownloads: CollectionConfig = {
  slug: mediaWithSignedDownloadsSlug,
  upload: true,
  fields: [],
}
