import type { CollectionConfig } from 'payload'

export const noLocalizedFieldsCollectionSlug = 'no-localized-fields'

export const NoLocalizedFieldsCollection: CollectionConfig = {
  slug: noLocalizedFieldsCollectionSlug,
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: false,
    },
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          name: 'en',
          type: 'group',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
