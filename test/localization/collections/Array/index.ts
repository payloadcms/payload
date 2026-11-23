import type { CollectionConfig } from 'payload'

export const arrayCollectionSlug = 'array-fields'

export const ArrayCollection: CollectionConfig = {
  slug: arrayCollectionSlug,
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          type: 'tabs',
          tabs: [
            {
              fields: [
                {
                  name: 'nestedItems',
                  type: 'array',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                    },
                  ],
                },
              ],
              label: 'Nested',
            },
          ],
        },
      ],
      localized: true,
    },
  ],
  versions: false,
}
