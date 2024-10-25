import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyClientField.js#MyClientFieldComponent',
        },
      },
      name: 'text',
      label: 'Client Text Field',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField',
      type: 'text',
    },
    {
      name: 'sel',
      type: 'select',
      options: ['a', 'b', 'c', 'd', 'f'],
    },
    {
      name: 'select',
      type: 'select',
      options: ['a', 'b', 'c', 'd', 'f'],
    },
    {
      name: 'richText',
      type: 'richText',
    },
    {
      name: 'myBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'test',
          fields: [
            {
              name: 'test',
              type: 'text',
            },
          ],
        },
        {
          slug: 'someBlock2',
          fields: [
            {
              name: 'test2',
              type: 'text',
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
