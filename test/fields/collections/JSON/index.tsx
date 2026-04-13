import type { CollectionConfig } from 'payload'

import { jsonFieldsSlug } from '../../slugs.js'

const JSON: CollectionConfig = {
  slug: jsonFieldsSlug,
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'json',
      type: 'json',
      admin: {
        maxHeight: 542,
      },
      jsonSchema: {
        fileMatch: ['a://b/foo.json'],
        schema: {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  object: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      array: {
                        type: 'array',
                        items: {
                          type: 'number',
                        },
                      },
                      text: {
                        type: 'string',
                      },
                    },
                  },
                  text: {
                    type: 'string',
                  },
                },
              },
            },
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
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'jsonWithinGroup',
          type: 'json',
        },
      ],
    },
    {
      name: 'customJSON',
      type: 'json',
      admin: {
        components: {
          afterInput: ['./collections/JSON/AfterField.js#AfterField'],
        },
      },
      label: 'Custom Json',
    },
  ],
  versions: {
    maxPerDoc: 1,
  },
}

export default JSON
