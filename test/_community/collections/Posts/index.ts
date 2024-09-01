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
          Label: '/collections/Posts/MyComponent.js#MyComponent',
        },
        description: 'This is a description',
      },
      name: 'text',
      type: 'text',
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
