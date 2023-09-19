import type { Config } from '../config/types'

import { sanitizeConfig } from '../config/sanitize'
import { configToJSONSchema } from './configToJSONSchema'

describe('configToJSONSchema', () => {
  it('should handle optional arrays with required fields', () => {
    const config: Config = {
      collections: [
        {
          fields: [
            {
              fields: [
                {
                  name: 'someRequiredField',
                  required: true,
                  type: 'text',
                },
              ],
              name: 'someRequiredField',
              type: 'array',
            },
          ],
          slug: 'test',
          timestamps: false,
        },
      ],
    }

    const sanitizedConfig = sanitizeConfig(config)
    const schema = configToJSONSchema(sanitizedConfig)
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
                type: 'string',
              },
              someRequiredField: {
                type: 'string',
              },
            },
            required: ['someRequiredField'],
            type: 'object',
          },
          type: 'array',
        },
      },
      required: ['id'],
      title: 'Test',
      type: 'object',
    });
  });


  it('should build default schema for json fields', () => {
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'someJsonField',
              type: 'json',
            },
          ],
          timestamps: false,
        },
      ],
    };

    const sanitizedConfig = sanitizeConfig(config);
    const schema = configToJSONSchema(sanitizedConfig);
    expect(schema?.definitions?.test).toStrictEqual({
      title: 'Test',
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        someJsonField: {
          oneOf: [
            {type: 'object'},
            {type: 'array'},
            {type: 'string'},
            {type: 'number'},
            {type: 'boolean'},
            {type: 'null'},
          ],
        },
      },
      required: ['id'],
    });
  });

  it('should build custom static schema for json fields', () => {
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'someJsonField',
              type: 'json',
              jsonSchema: {
                type: 'object',
                properties: {
                  someField: {type: 'string'}
                },
                required: ['someField'],
              }
            },
          ],
          timestamps: false,
        },
      ],
    };

    const sanitizedConfig = sanitizeConfig(config);
    const schema = configToJSONSchema(sanitizedConfig);
    expect(schema?.definitions?.test).toStrictEqual({
      title: 'Test',
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        someJsonField: {
          type: 'object',
          properties: {
            someField: {type: 'string'}
          },
          required: ['someField'],
        },
      },
      required: ['id'],
    });
  });

  it('should build custom dynamic schema for json fields', () => {
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'someJsonField',
              type: 'json',
              jsonSchema: (field, interfaceNameDefinitions) => {
                interfaceNameDefinitions.set('MyCustomType', {
                  type: 'object',
                  properties: {
                    someField: {type: 'string'},
                  },
                  required: ['someField'],
                })

                return {$ref: '#/definitions/MyCustomType'};
              },
            },
          ],
          timestamps: false,
        },
      ],
    };

    const sanitizedConfig = sanitizeConfig(config);
    const schema = configToJSONSchema(sanitizedConfig);
    expect(schema?.definitions?.test).toStrictEqual({
      title: 'Test',
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        someJsonField: {$ref: '#/definitions/MyCustomType'},
      },
      required: ['id'],
    });
    expect(schema?.definitions?.MyCustomType).toStrictEqual({
      type: 'object',
      properties: {
        someField: {type: 'string'},
      },
      required: ['someField'],
    });
  });
});
