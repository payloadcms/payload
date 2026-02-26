import type { CollectionConfig } from 'payload'

import { customViews1CollectionSlug } from '../slugs.js'

export const CustomViews1: CollectionConfig = {
  slug: customViews1CollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: true,
}
