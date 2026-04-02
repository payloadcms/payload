import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Regression1: CollectionConfig = {
  slug: 'regression1',
  access: {
    create: () => false,
    read: () => true,
  },
  fields: [
    {
      name: 'group1',
      type: 'group',
      fields: [
        {
          name: 'richText1',
          type: 'richText',
          editor: lexicalEditor(),
        },
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'tab1',
          fields: [
            {
              name: 'richText2',
              type: 'richText',
              editor: lexicalEditor(),
            },
            {
              name: 'blocks2',
              type: 'blocks',
              blocks: [
                {
                  slug: 'myBlock',
                  fields: [
                    {
                      name: 'richText3',
                      type: 'richText',
                      editor: lexicalEditor(),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'tab2',
          fields: [
            {
              name: 'richText4',
              type: 'richText',
              editor: lexicalEditor(),
            },
            {
              name: 'blocks3',
              type: 'blocks',
              blocks: [
                {
                  slug: 'myBlock2',
                  fields: [
                    {
                      name: 'richText5',
                      type: 'richText',
                      editor: lexicalEditor(),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'art',
          type: 'richText',
          editor: lexicalEditor(),
        },
      ],
    },
    {
      name: 'arrayWithAccessFalse',
      type: 'array',
      access: {
        update: () => false,
      },
      fields: [
        {
          name: 'richText6',
          type: 'richText',
          editor: lexicalEditor(),
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'myBlock3',
          fields: [
            {
              name: 'richText7',
              type: 'richText',
              editor: lexicalEditor(),
            },
          ],
        },
      ],
    },
  ],
}
