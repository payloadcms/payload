import type { Config } from '../config/types.js'

import { sanitizeConfig } from '../config/sanitize.js'
import { configToJSONSchema } from './configToJSONSchema.js'

describe('configToJSONSchema', () => {
  it('should handle optional arrays with required fields', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [
        {
          fields: [
            {
              name: 'someRequiredField',
              type: 'array',
              fields: [
                {
                  name: 'someRequiredField',
                  required: true,
                  type: 'text',
                },
              ],
            },
          ],
          slug: 'test',
          timestamps: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

    expect(schema?.definitions?.test).toStrictEqual({
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        someRequiredField: {
          items: {
            additionalProperties: false,
            properties: {
              id: {
                type: ['string', 'null'],
              },
              someRequiredField: {
                type: 'string',
              },
            },
            required: ['someRequiredField'],
            type: 'object',
          },
          type: ['array', 'null'],
        },
      },
      required: ['id'],
      title: 'Test',
      type: 'object',
    })
  })

  it('should handle tabs and named tabs with required fields', async () => {
    // @ts-expect-error
    const config: Config = {
      collections: [
        {
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  label: 'unnamedTab',
                  fields: [
                    {
                      type: 'text',
                      name: 'fieldInUnnamedTab',
                    },
                  ],
                },
                {
                  label: 'namedTab',
                  name: 'namedTab',
                  fields: [
                    {
                      type: 'text',
                      name: 'fieldInNamedTab',
                    },
                  ],
                },
                {
                  label: 'namedTabWithRequired',
                  name: 'namedTabWithRequired',
                  fields: [
                    {
                      type: 'text',
                      name: 'fieldInNamedTab',
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
          slug: 'test',
          timestamps: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

    expect(schema?.definitions?.test).toStrictEqual({
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        fieldInUnnamedTab: {
          type: ['string', 'null'],
        },
        namedTab: {
          additionalProperties: false,
          type: 'object',
          properties: {
            fieldInNamedTab: {
              type: ['string', 'null'],
            },
          },
          required: [],
        },
        namedTabWithRequired: {
          additionalProperties: false,
          type: 'object',
          properties: {
            fieldInNamedTab: {
              type: 'string',
            },
          },
          required: ['fieldInNamedTab'],
        },
      },
      required: ['id', 'namedTabWithRequired'],
      title: 'Test',
      type: 'object',
    })
  })
})
