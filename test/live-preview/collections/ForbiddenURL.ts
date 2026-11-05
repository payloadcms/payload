import type { CollectionConfig } from 'payload'

import { forbiddenURLSlug } from '../shared.js'

export const ForbiddenURL: CollectionConfig = {
  slug: forbiddenURLSlug,
  admin: {
    livePreview: {
      url: () => 'mailto:editor@example.com',
    },
    preview: () => 'mailto:editor@example.com',
  },
  fields: [],
  versions: false,
}
