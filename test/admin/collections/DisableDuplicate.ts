import type { CollectionConfig } from 'payload/types'

import { disableDuplicateSlug } from '../slugs.js'

export const DisableDuplicate: CollectionConfig = {
  slug: disableDuplicateSlug,
  disableDuplicate: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
