import type { Config } from '../config/types';

import { sanitizeConfig } from '../config/sanitize';
import { configToJSONSchema } from './configToJSONSchema';

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
    };

    const sanitizedConfig = sanitizeConfig(config);
    const schema = configToJSONSchema(sanitizedConfig);
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
});
