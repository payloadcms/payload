import type { CollectionConfig } from 'payload'

export const LexicalInBlock: CollectionConfig = {
  slug: 'LexicalInBlock',
  fields: [
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'lexicalInBlock',
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
