import type { CollectionConfig } from 'payload'

import { slugs } from '../../shared.js'

export const PagesCollection: CollectionConfig = {
  slug: slugs.pages,
  admin: {
    useAsTitle: 'title',
  },
  treeView: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
