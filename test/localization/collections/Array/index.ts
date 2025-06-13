import type { CollectionConfig } from 'payload'

export const arrayCollectionSlug = 'array-fields'

export const ArrayCollection: CollectionConfig = {
  slug: arrayCollectionSlug,
  fields: [
    {
      name: 'items',
      type: 'array',
      localized: true,
      required: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'itemsReadOnly',
      type: 'array',
      localized: true,
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
