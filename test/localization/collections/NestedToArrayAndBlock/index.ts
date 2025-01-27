import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const nestedToArrayAndBlockCollectionSlug = 'nested-to-array-and-block'

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
