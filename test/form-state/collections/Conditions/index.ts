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
      name: 'conditionalCustomField',
      type: 'text',
      admin: {
        condition: (data) => data?.title === 'show-conditional',
        components: {
          Field: './collections/Posts/TextField.js#CustomTextField',
        },
      },
    },
  ],
}
