import type { CollectionConfig } from 'payload'

import { reorderTabsSlug } from '../slugs.js'

export const ReorderTabs: CollectionConfig = {
  slug: reorderTabsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: true,
}
