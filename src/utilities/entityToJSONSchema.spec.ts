import sanitizeConfig from '../config/sanitize';
import { Config } from '../config/types';
import { entityToJSONSchema } from './entityToJSONSchema';

describe('entityToJSONSchema', () => {
  it('should handle optional arrays with required fields', () => {
    const config: Config = {
      collections: [
        {
          slug: 'test',
          fields: [
            {
              name: 'someRequiredField',
              type: 'array',
              fields: [
                {
                  name: 'someRequiredField',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
          timestamps: false,
        },
      ],
    };

    const sanitizedConfig = sanitizeConfig(config);
    const schema = entityToJSONSchema(sanitizedConfig, sanitizedConfig.collections[0]);

    expect(schema).toStrictEqual({
      title: 'Test',
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        someRequiredField: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              someRequiredField: {
                type: 'string',
              },
              id: {
                type: 'string',
              },
            },
            required: ['someRequiredField'],
          },
        },
      },
      required: ['id'],
    });
  });
});
