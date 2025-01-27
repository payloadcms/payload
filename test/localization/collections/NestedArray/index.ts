import type { CollectionConfig } from 'payload/types'

export const NestedArray: CollectionConfig = {
  slug: 'nested-arrays',
  fields: [
    {
      name: 'arrayWithBlocks',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'blocksWithinArray',
          type: 'blocks',
          blocks: [
            {
              slug: 'someBlock',
              fields: [
                {
                  name: 'relationWithinBlock',
                  type: 'relationship',
                  relationTo: 'localized-posts',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'arrayWithLocalizedRelation',
      type: 'array',
      fields: [
        {
          name: 'localizedRelation',
          type: 'relationship',
          localized: true,
          relationTo: 'localized-posts',
        },
      ],
    },
  ],
}
