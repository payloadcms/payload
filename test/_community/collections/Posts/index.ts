import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
    enableListViewSelectAPI: true,
  },
  defaultSort: '-updatedAt',
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
      type: 'relationship',
      name: 'relatedArticle',
      relationTo: 'posts',
      admin: {
        sortOptions: '-updatedAt',
      },
    },
  ],
}
