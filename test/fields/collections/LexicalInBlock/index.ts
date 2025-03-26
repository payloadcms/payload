import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const LexicalInBlock: CollectionConfig = {
  slug: 'LexicalInBlock',
  fields: [
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          BlocksFeature({
            blocks: [
              {
                slug: 'blockInLexical',
                fields: [
                  {
                    name: 'lexicalInBlock',
                    label: 'My Label',
                    type: 'richText',
                    required: true,
                    editor: lexicalEditor(),
                    admin: {
                      description: 'Some Description',
                    },
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
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
              editor: lexicalEditor({
                features: [
                  BlocksFeature({
                    inlineBlocks: [
                      {
                        slug: 'inlineBlockInLexical',
                        fields: [
                          {
                            name: 'text',
                            type: 'text',
                          },
                        ],
                      },
                    ],
                  }),
                ],
              }),
            },
          ],
        },
      ],
    },
  ],
}
