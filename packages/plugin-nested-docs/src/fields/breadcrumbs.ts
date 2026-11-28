import type { ArrayField, Field } from 'payload'

export const createBreadcrumbsField = (
  relationTo: string,
  overrides: Partial<ArrayField> = {},
): Field => ({
  name: 'breadcrumbs',
  type: 'array',
  localized: true,
  ...(overrides || {}),
  admin: {
    readOnly: true,
    ...(overrides?.admin || {}),
  },
  fields: [
    {
      name: 'doc',
      type: 'relationship',
      admin: {
        disabled: true,
      },
      maxDepth: 0,
      relationTo,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'url',
          type: 'text',
          admin: {
            width: '33%',
          },
          label: 'URL',
        },
        {
          name: 'path',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '33%',
          },
        },
      ],
    },
    ...(overrides?.fields || []),
  ],
})
