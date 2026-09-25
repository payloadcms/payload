import type { JSONField } from '../../fields/config/types.js'

export const managedFileManifestJSONSchema: NonNullable<JSONField['jsonSchema']> = {
  fileMatch: [],
  schema: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        roles: {
          type: 'array',
          items: {
            oneOf: [
              {
                type: 'object',
                additionalProperties: false,
                properties: {
                  type: { enum: ['size'] },
                  sizeKey: { type: 'string' },
                },
                required: ['type', 'sizeKey'],
              },
              {
                type: 'object',
                additionalProperties: false,
                properties: {
                  type: { enum: ['original', 'default', 'thumbnail'] },
                },
                required: ['type'],
              },
            ],
          },
        },
        storageBackendId: { type: 'string' },
      },
      required: ['storageBackendId', 'key', 'roles'],
    },
  },
  uri: 'payload://managed-file-manifest',
}
