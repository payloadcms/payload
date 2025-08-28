import type { CollectionConfig } from 'payload'

export const OnDemand: CollectionConfig = {
  slug: 'onDemand',
  fields: [
    {
      name: 'ui',
      type: 'ui',
      admin: {
        components: {
          Field: './collections/OnDemand/OnDemand.js#OnDemand',
        },
      },
    },
  ],
}
