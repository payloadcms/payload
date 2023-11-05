import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { jsonFieldsSlug } from '../../slugs'

type JSONField = {
  createdAt: string
  id: string
  json?: any
  updatedAt: string
}

const JSON: CollectionConfig = {
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'json',
      type: 'json',
    },
  ],
  slug: jsonFieldsSlug,
  versions: {
    maxPerDoc: 1,
  },
}

export const jsonDoc: Partial<JSONField> = {
  json: {
    arr: ['val1', 'val2', 'val3'],
    nested: {
      value: 'nested value',
    },
    property: 'value',
  },
}

export default JSON
