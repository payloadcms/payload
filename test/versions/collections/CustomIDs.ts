import type { CollectionConfig } from 'payload'

import { customIDSlug } from '../slugs.js'

const CustomIDs: CollectionConfig = {
  slug: customIDSlug,
  admin: {
    defaultColumns: ['id', 'title', 'createdAt'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'id',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
  ],
  versions: {
    drafts: false,
    maxPerDoc: 2,
  },
}

export default CustomIDs
