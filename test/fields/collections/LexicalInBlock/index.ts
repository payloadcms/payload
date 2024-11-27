import type { CollectionConfig } from 'payload'

export const LexicalInBlock: CollectionConfig = {
  slug: 'LexicalInBlock',
  fields: [
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'lexicalInBlock2',
          fields: [
            {
              name: 'lexical',
              type: 'richText',
            },
          ],
        },
      ],
    },
  ],
}
