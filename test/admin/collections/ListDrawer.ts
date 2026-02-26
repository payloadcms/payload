import type { CollectionConfig } from 'payload'

import { listDrawerSlug } from '../slugs.js'

export const ListDrawer: CollectionConfig = {
  slug: listDrawerSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'number',
      type: 'number',
    },
  ],
}
