import type { CollectionConfig } from 'payload'

import { menuItemsSlug } from '../shared.js'

export const MenuItems: CollectionConfig = {
  slug: menuItemsSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
