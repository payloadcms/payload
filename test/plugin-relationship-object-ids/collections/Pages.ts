import type { CollectionConfig } from 'payload/types'

import { pagesSlug } from '../shared.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
