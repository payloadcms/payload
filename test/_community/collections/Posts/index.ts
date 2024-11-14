import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
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
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
