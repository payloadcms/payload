import type { Field } from 'payload'

export const buildExifFields = (fieldName: string): Field[] => [
  {
    name: fieldName,
    type: 'group',
    admin: {
      components: {
        Field: {
          clientProps: { fieldName },
          path: '@payloadcms/plugin-exif/client#ExifProperties',
        },
      },
    },
    fields: [
      { name: 'raw', type: 'json' },
      { name: 'takenAt', type: 'date', index: true },
      { name: 'location', type: 'point' },
    ],
  },
]
