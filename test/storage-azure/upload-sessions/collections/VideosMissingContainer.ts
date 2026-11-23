import type { CollectionConfig } from 'payload'

import { videosMissingContainerSlug } from '../../shared.js'
import { Videos } from './Videos.js'

/** Stored in a container that does not exist, so every upload session fails permanently. */
export const VideosMissingContainer: CollectionConfig = {
  ...Videos,
  slug: videosMissingContainerSlug,
}
