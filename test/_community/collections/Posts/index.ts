import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
    enableListViewSelectAPI: true,
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
      name: 'enableTabs',
      type: 'checkbox',
      label: 'Enable Tabs',
      defaultValue: false,
    },
    {
      type: 'tabs',
      admin: {
        condition: (data) => data.enableTabs === true,
      },
      tabs: [
        {
          label: 'Tab 1',
          description: 'Test description for Tab 1',
          fields: [
            {
              name: 'test1',
              type: 'text',
              label: 'Test Field 1',
            },
          ],
        },
        {
          label: 'Tab 2',
          description: 'Test description for Tab 2',
          fields: [
            {
              name: 'test2',
              type: 'text',
              label: 'Test Field 2',
            },
          ],
        },
      ],
    },
  ],
}
