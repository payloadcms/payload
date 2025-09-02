import type { CollectionConfig } from 'payload'

export const OnDemandDefault: CollectionConfig = {
  slug: 'onDemandDefault',
  fields: [
    {
      name: 'ui',
      type: 'json',
      admin: {
        components: {
          Field: './collections/OnDemandDefault/Component.js#Component',
        },
      },
    },
  ],
}
