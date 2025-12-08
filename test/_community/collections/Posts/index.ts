import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    enableListViewSelectAPI: true,
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
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Example hook with random delay between 250-500ms
        const delay = Math.floor(Math.random() * 250) + 250
        await new Promise((resolve) => setTimeout(resolve, delay))
        return data
      },
      async ({ data }) => {
        // Example hook with random delay between 250-500ms
        const delay = Math.floor(Math.random() * 250) + 250
        await new Promise((resolve) => setTimeout(resolve, delay))
        return data
      },
      async ({ data }) => {
        // Example hook with random delay between 250-500ms
        const delay = Math.floor(Math.random() * 250) + 250
        await new Promise((resolve) => setTimeout(resolve, delay))
        return data
      },
    ],
    beforeRead: [
      async ({ doc }) => {
        // Example hook with random delay between 250-500ms
        const delay = Math.floor(Math.random() * 250) + 250
        await new Promise((resolve) => setTimeout(resolve, delay))
        return doc
      },
      async ({ doc }) => {
        // Example hook with random delay between 250-500ms
        const delay = Math.floor(Math.random() * 250) + 250
        await new Promise((resolve) => setTimeout(resolve, delay))
        return doc
      },
      async ({ doc }) => {
        // Example hook with random delay between 250-500ms
        const delay = Math.floor(Math.random() * 250) + 250
        await new Promise((resolve) => setTimeout(resolve, delay))
        return doc
      },
    ],
  },
}
