import type { CollectionConfig } from 'payload'

export const conditionsSlug = 'conditions'

export const ConditionsCollection: CollectionConfig = {
  slug: conditionsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
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
  ],
}
