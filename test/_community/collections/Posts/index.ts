import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            inlineBlocks: [
              {
                slug: 'myInlineBlock',
                admin: {
                  components: {
                    Label: '/collections/Posts/LabelComponent.js#LabelComponent',
                  },
                },
                fields: [
                  {
                    name: 'key',
                    label: () => {
                      return 'Key'
                    },
                    type: 'select',
                    options: ['value1', 'value2', 'value3'],
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    // {
    //   name: 'richText',
    //   type: 'richText',
    // },
    // {
    //   name: 'myBlocks',
    //   type: 'blocks',
    //   blocks: [
    //     {
    //       slug: 'test',
    //       fields: [
    //         {
    //           name: 'test',
    //           type: 'text',
    //         },
    //       ],
    //     },
    //     {
    //       slug: 'someBlock2',
    //       fields: [
    //         {
    //           name: 'test2',
    //           type: 'text',
    //         },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   type: 'row',
    //   fields: [],
    // },
    // {
    //   name: 'associatedMedia',
    //   type: 'upload',
    //   access: {
    //     create: () => true,
    //     update: () => false,
    //   },
    //   relationTo: mediaSlug,
    // },
  ],
  versions: {
    drafts: true,
  },
}
