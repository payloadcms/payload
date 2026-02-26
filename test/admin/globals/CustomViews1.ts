import type { GlobalConfig } from 'payload'

import { customGlobalViews1GlobalSlug } from '../slugs.js'

export const CustomGlobalViews1: GlobalConfig = {
  slug: customGlobalViews1GlobalSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: true,
}
