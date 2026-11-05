import type { CollectionConfig } from 'payload'

import { mediaWithDisabledPluginSlug } from '../shared.js'

export const MediaWithDisabledPlugin: CollectionConfig = {
  slug: mediaWithDisabledPluginSlug,
  fields: [],
  upload: true,
  versions: false,
}
