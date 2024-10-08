import type { CollectionConfig } from 'payload/types'

export const blocksCollectionSlug = 'blocks-fields'

export const BlocksCollection: CollectionConfig = {
  slug: blocksCollectionSlug,
  fields: [
    {
      name: 'content',
      label: 'Content',
      type: 'blocks',
      localized: true,
      blocks: [
        {
          slug: 'blockInsideBlock',
          fields: [
            {
              name: 'content',
              type: 'blocks',
              blocks: [
                {
                  slug: 'textBlock',
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
        },
      ],
    },
  ],
}
