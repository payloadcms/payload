import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

import { jsonFieldsSlug } from '../../slugs.js'

type JSONField = {
  createdAt: string
  id: string
  json?: any
  updatedAt: string
}

const JSON: CollectionConfig = {
  slug: jsonFieldsSlug,
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'json',
      type: 'json',
    },
  ],
  versions: {
    maxPerDoc: 1,
  },
}

export default JSON
