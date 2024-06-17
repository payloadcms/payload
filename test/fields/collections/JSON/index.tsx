import type { CollectionConfig } from 'payload'

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
      jsonSchema: {
        fileMatch: ['a://b/foo.json'],
        schema: {
          type: 'object',
          properties: {
            foo: {
              enum: ['bar', 'foobar'],
            },
            number: {
              enum: [10, 5],
            },
          },
        },
        uri: 'a://b/foo.json',
      },
    },
  ],
  versions: {
    maxPerDoc: 1,
  },
}

export default JSON
