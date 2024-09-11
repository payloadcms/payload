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
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField1',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField2',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField3',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField4',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField5',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField6',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField7',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField8',
      type: 'text',
    },
    {
      admin: {
        components: {
          Field: '/collections/Posts/MyServerField.js#MyServerFieldComponent',
        },
      },
      name: 'serverTextField9',
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
