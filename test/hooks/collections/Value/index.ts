import type { CollectionConfig } from 'payload'

export const valueHooksSlug = 'value-hooks'
export const ValueCollection: CollectionConfig = {
  slug: valueHooksSlug,
  fields: [
    {
      name: 'slug',
      type: 'text',
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            siblingData.beforeValidate_value = String(value)
            return value
          },
        ],
        beforeChange: [
          ({ value, siblingData }) => {
            siblingData.beforeChange_value = String(value)
            return value
          },
        ],
      },
    },
    {
      name: 'beforeValidate_value',
      type: 'text',
    },
    {
      name: 'beforeChange_value',
      type: 'text',
    },
  ],
}
