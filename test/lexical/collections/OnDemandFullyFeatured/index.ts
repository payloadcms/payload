import type { CollectionConfig } from 'payload'

export const OnDemandFullyFeatured: CollectionConfig = {
  slug: 'OnDemandFullyFeatured',
  fields: [
    {
      name: 'ui',
      type: 'json',
      admin: {
        components: {
          Field: './collections/OnDemandFullyFeatured/Component.js#Component',
        },
      },
    },
  ],
}
