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
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'testSelect',
          type: 'select',
          options: [
            {
              label: 'Option 1',
              value: 'option1',
            },
            {
              label: 'Option 2',
              value: 'option2',
            },
            {
              label: 'Option 3',
              value: 'option3',
            },
            {
              label: 'Option 4',
              value: 'option4',
            },
            {
              label: 'Option 5',
              value: 'option5',
            },
            {
              label: 'Option 6',
              value: 'option6',
            },
            {
              label: 'Option 7',
              value: 'option7',
            },
          ],
        },
      ],
    },
  ],
}
