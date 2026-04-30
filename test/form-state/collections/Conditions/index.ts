import type { CollectionConfig } from 'payload'

export const conditionsSlug = 'conditions'

export const ConditionsCollection: CollectionConfig = {
  slug: conditionsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'showConditionalFields',
      type: 'checkbox',
      label: 'Show conditional fields?',
    },
    {
      name: 'conditionalTextField',
      type: 'text',
      label: 'Visible when `showConditionalFields` is true',
      admin: {
        condition: './collections/Conditions/conditions/showWhenChecked.js#showWhenChecked',
      },
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'showConditionalFields',
          type: 'checkbox',
          label: 'Show conditional fields?',
        },
        {
          name: 'conditionalRowField',
          type: 'text',
          label: 'Visible when `showConditionalFields` is true in this row',
          admin: {
            condition:
              './collections/Conditions/conditions/showWhenRowChecked.js#showWhenRowChecked',
          },
        },
      ],
    },
  ],
}
