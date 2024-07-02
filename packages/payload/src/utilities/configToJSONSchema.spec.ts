import type { Config } from '../config/types.js'

import { sanitizeConfig } from '../config/sanitize.js'
import { configToJSONSchema } from './configToJSONSchema.js'
import { JSONSchema4 } from 'json-schema'

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

  it('should handle custom typescript schema and JSON field schema', async () => {
    const customSchema: JSONSchema4 = {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
        required: ['id'],
      },
    }

    const config: Partial<Config> = {
      collections: [
        {
          fields: [
            {
              type: 'text',
              name: 'withCustom',
              typescriptSchema: [() => customSchema],
            },
            {
              type: 'json',
              name: 'jsonWithSchema',
              jsonSchema: {
                uri: 'a://b/foo.json',
                fileMatch: ['a://b/foo.json'],
                schema: customSchema,
              },
            },
          ],
          slug: 'test',
          timestamps: false,
        },
      ],
    }

    const sanitizedConfig = await sanitizeConfig(config as Config)
    const schema = configToJSONSchema(sanitizedConfig, 'text')

    expect(schema?.definitions?.test).toStrictEqual({
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        withCustom: customSchema,
        jsonWithSchema: customSchema,
      },
      required: ['id'],
      title: 'Test',
      type: 'object',
    })
  })
})
