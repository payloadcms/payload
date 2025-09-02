import type { CollectionConfig } from 'payload'

export const OnDemandForm: CollectionConfig = {
  slug: 'OnDemandForm',
  fields: [
    {
      name: 'json',
      type: 'json',
      admin: {
        components: {
          Field: './collections/OnDemandForm/Component.js#Component',
        },
      },
    },
  ],
}
