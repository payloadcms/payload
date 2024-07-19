import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

// import { MyComponent } from './MyComponent.js'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
    },
    {
      name: 'richText2',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'testblock',
                fields: [
                  {
                    name: 'testfield',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    {
      name: 'presidents',
      type: 'select',
      hasMany: false,
      // admin: {
      //   components: {
      //     Field: MyComponent,
      //   },
      // },
      options: [
        {
          label: '1700s',
          options: [
            {
              label: 'George Washington',
              value: '1',
            },
            {
              label: 'John Adams',
              value: '2',
            },
          ],
        },
        {
          label: '1800s',
          options: [
            {
              label: 'Thomas Jefferson',
              value: '3',
            },
            {
              label: 'James Madison',
              value: '4',
            },
          ],
        },
      ],
    },
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
