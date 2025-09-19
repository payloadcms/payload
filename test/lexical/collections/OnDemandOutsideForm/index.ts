import type { CollectionConfig } from 'payload'

export const OnDemandOutsideForm: CollectionConfig = {
  slug: 'OnDemandOutsideForm',
  fields: [
    {
      name: 'json',
      type: 'json',
      admin: {
        components: {
          Field: './collections/OnDemandOutsideForm/Component.js#Component',
        },
      },
    },
    {
      name: 'hiddenAnchor',
      type: 'richText',
      admin: {
        hidden: true,
      },
    },
  ],
}
