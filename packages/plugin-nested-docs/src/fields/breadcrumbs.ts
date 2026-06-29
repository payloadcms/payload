import type { ArrayField, Field } from 'payload'

export const createBreadcrumbsField = (
  relationTo: string,
  overrides: Partial<ArrayField> = {},
): Field => ({
  name: 'breadcrumbs',
  type: 'array',
  labels: {
    // @ts-expect-error - translations are not typed in plugins yet
    plural: ({ t }) => t('plugin-nested-docs:breadcrumbsPlural'),
    // @ts-expect-error - translations are not typed in plugins yet
    singular: ({ t }) => t('plugin-nested-docs:breadcrumbsSingular'),
  },
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
      // @ts-expect-error - translations are not typed in plugins yet
      label: ({ t }) => t('plugin-nested-docs:doc'),
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
            width: '50%',
          },
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-nested-docs:url'),
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%',
          },
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-nested-docs:label'),
        },
      ],
    },
    ...(overrides?.fields || []),
  ],
})
