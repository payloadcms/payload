import type { CollectionConfig } from 'payload'

import { slugs } from '../../shared.js'

export const TagsCollection: CollectionConfig = {
  slug: slugs.tags,
  treeView: true,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
