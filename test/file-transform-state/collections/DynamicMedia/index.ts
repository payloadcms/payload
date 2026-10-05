import type { CollectionConfig } from 'payload'

import { dynamicMediaSlug } from '../../shared.js'
import { Media } from '../Media/index.js'

export const DynamicMedia: CollectionConfig = {
  ...Media,
  slug: dynamicMediaSlug,
}
