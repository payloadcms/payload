import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

type JSONField = {
  createdAt: string
  id: string
  json?: any
  updatedAt: string
}

const JSON: CollectionConfig = {
  fields: [
    {
      name: 'json',
      type: 'json',
    },
  ],
  slug: 'json-fields',
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
