import type { CollectionConfig } from 'payload'

import { defaultColors, lexicalEditor, TextStateFeature } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TextStateFeature({
            state: {
              color: { ...defaultColors.text },
              backgroundColor: { ...defaultColors.background },
            },
          }),
        ],
      }),
    },
  ],
}
