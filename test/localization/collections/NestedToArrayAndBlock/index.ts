import type { CollectionConfig } from 'payload'

export const nestedToArrayAndBlockCollectionSlug = 'nested'

export const NestedToArrayAndBlock: CollectionConfig = {
  slug: nestedToArrayAndBlockCollectionSlug,
  fields: [
    {
      type: 'blocks',
      name: 'blocks',
      blocks: [
        {
          slug: 'block',
          fields: [
            {
              name: 'array',
              type: 'array',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'textNotLocalized',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
