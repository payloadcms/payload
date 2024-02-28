import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { customIDSlug } from '../slugs'

const CustomIDs: CollectionConfig = {
  slug: customIDSlug,
  admin: {
    defaultColumns: ['id', 'title', 'createdAt'],
    preview: () => 'https://payloadcms.com',
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
