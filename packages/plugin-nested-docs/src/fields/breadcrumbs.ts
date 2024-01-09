import type { ArrayField, Field } from 'payload/types'

export const createBreadcrumbsField = (
  relationTo: string,
  overrides: Partial<ArrayField> = {},
): Field => ({
  name: 'breadcrumbs',
  localized: true,
  type: 'array',
  ...(overrides || {}),
  admin: {
    readOnly: true,
    ...(overrides?.admin || {}),
  },
  fields: [
    {
      name: 'doc',
      admin: {
        disabled: true,
      },
      maxDepth: 0,
      relationTo,
      type: 'relationship',
    },
    {
      fields: [
        {
          name: 'url',
          admin: {
            width: '50%',
          },
          label: 'URL',
          type: 'text',
        },
        {
          name: 'label',
          admin: {
            width: '50%',
          },
          type: 'text',
        },
      ],
      type: 'row',
    },
    ...(overrides?.fields || []),
  ],
})

export default createBreadcrumbsField
