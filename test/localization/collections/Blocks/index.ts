import type { CollectionConfig } from 'payload'

export const blocksCollectionSlug = 'blocks-fields'

export const BlocksCollection: CollectionConfig = {
  slug: blocksCollectionSlug,
  fields: [
    {
      name: 'content',
      label: 'Content',
      type: 'blocks',
      blocks: [
        {
          slug: 'blockInsideBlock',
          fields: [
            {
              name: 'myText',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
}
