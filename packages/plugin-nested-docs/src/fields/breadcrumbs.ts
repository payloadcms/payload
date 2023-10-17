import type { ArrayField, Field } from 'payload/types'

const createBreadcrumbsField = (
  relationTo: string,
  overrides: Partial<ArrayField> = {},
): Field => ({
  name: 'breadcrumbs',
  type: 'array',
  localized: true,
  fields: [
    {
      name: 'doc',
      type: 'relationship',
      relationTo,
      maxDepth: 0,
      admin: {
        disabled: true,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    ...(overrides?.fields || []),
  ],
  admin: {
    readOnly: true,
    ...(overrides?.admin || {}),
  },
  ...(overrides || {}),
})

export default createBreadcrumbsField
