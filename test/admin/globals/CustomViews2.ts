import type { GlobalConfig } from 'payload'

import { customGlobalViews2GlobalSlug } from '../slugs.js'

export const CustomGlobalViews2: GlobalConfig = {
  slug: customGlobalViews2GlobalSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: true,
}
