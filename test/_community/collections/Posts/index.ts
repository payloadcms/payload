import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { MyComponent } from './MyComponent.js'

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
      type: 'select',
      name: 'customSelect',
      // admin: {
      //   components: {
      //     Field: MyComponent,
      //   },
      // },
      options: [
        {
          label: 'group1',
          options: [
            {
              label: 'Group-1 Item-1',
              value: 'group1Item1',
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
