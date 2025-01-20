import type { Block, CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor, TreeViewFeature } from '@payloadcms/richtext-lexical'

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
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [ContactBlock] }),
          TreeViewFeature(),
        ],
      }),
    },
  ],
  versions: {
    drafts: true,
  },
}

export const ContactBlock: Block = {
  slug: 'contact',
  fields: [
    {
      name: 'first',
      label: 'first line',
      required: true,
      type: 'text',
      admin: {
        description: '...',
      },
    },
    {
      name: 'two',
      label: 'second line',
      required: true,
      type: 'text',
      admin: {
        description: '...',
      },
    },
  ],
  interfaceName: 'ContactBlock',
}
