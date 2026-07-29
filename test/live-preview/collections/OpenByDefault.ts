import type { CollectionConfig } from 'payload'

import { openByDefaultSlug } from '../shared.js'

export const OpenByDefault: CollectionConfig = {
  slug: openByDefaultSlug,
  admin: {
    description: 'Live Preview opens automatically on first visit via `openByDefault`.',
    useAsTitle: 'title',
    livePreview: {
      openByDefault: true,
      url: `http://localhost:${process.env.PORT || 3000}/live-preview`,
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: false,
}
