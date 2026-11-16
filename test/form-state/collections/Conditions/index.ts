import type { CollectionConfig } from 'payload'

export const conditionsSlug = 'conditions'

export const ConditionsCollection: CollectionConfig = {
  slug: conditionsSlug,
  fields: [
    {
      name: 'showField',
      type: 'checkbox',
    },
    {
      name: 'conditionalCustomField',
      type: 'text',
      admin: {
        condition: (data) => data?.showField === true,
        components: {
          Field: './collections/Conditions/CustomField.js#CustomTextField',
        },
      },
    },
    {
      type: 'row',
      admin: {
        condition: (data) => data?.showField === true,
      },
      fields: [
        {
          name: 'conditionalRowField',
          type: 'text',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Conditional Collapsible',
      admin: {
        condition: (data) => data?.showField === true,
      },
      fields: [
        {
          name: 'conditionalCollapsibleField',
          type: 'text',
        },
      ],
    },
  ],
}
