import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

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
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },
    {
      type: 'json',
      name: 'json',
      admin: {
        editorOptions: {
          tabSize: 8,
          insertSpaces: false,
        },
      },
    },
    {
      type: 'code',
      name: 'code',
      admin: {
        language: 'json',
        editorOptions: {
          tabSize: 4,
          insertSpaces: false,
        },
      },
    },
  ],
}
