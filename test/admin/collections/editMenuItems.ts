import type { CollectionConfig } from 'payload'

import { editMenuItemsSlug } from '../slugs.js'

export const EditMenuItems: CollectionConfig = {
  slug: editMenuItemsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
