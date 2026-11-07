import type { CollectionConfig } from 'payload'

import { videosWithDraftsSlug } from '../../shared.js'
import { Videos } from './Videos.js'

export const VideosWithDrafts: CollectionConfig = {
  ...Videos,
  slug: videosWithDraftsSlug,
  versions: { drafts: true },
}
