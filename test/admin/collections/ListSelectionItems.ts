import type { CollectionConfig } from 'payload'

import { listSelectionItemsSlug } from '../slugs.js'

export const ListSelectionItems: CollectionConfig = {
  slug: listSelectionItemsSlug,
  admin: {
    components: {
      listSelectionItems: [
        {
          path: '/components/ListSelectionItems/index.js#ListSelectionItemClient',
        },
      ],
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
