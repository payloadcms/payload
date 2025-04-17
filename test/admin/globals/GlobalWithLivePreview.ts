import type { GlobalConfig } from 'payload'

import { globalWithLivePreviewSlug } from '../slugs.js'

export const GlobalWithLivePreview: GlobalConfig = {
  slug: globalWithLivePreviewSlug,
  fields: [
    {
      type: 'text',
      name: 'text',
    },
  ],
}
