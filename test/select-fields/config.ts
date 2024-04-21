import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  admin: {
    user: 'users',
    autoLogin: false,
  },
  globals: [],
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'categories',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts',
      fields: [
        {
          type: 'text',
          name: 'title',
        },
        {
          type: 'array',
          name: 'array',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'groupMultiple',
          fields: [
            {
              name: 'titleFirst',
              type: 'text',
            },
            {
              name: 'titleSecond',
              type: 'text',
            },
          ],
        },
        {
          type: 'array',
          name: 'arrayMultiple',
          fields: [
            {
              name: 'titleFirst',
              type: 'text',
            },
            {
              name: 'titleSecond',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'groupArray',
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
                  name: 'title',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          type: 'blocks',
          name: 'blocks',
          blocks: [
            {
              slug: 'section',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'secondTitle',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          type: 'relationship',
          relationTo: 'categories',
          name: 'category',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    // await payload.create({
    //   collection: 'users',
    //   data: {
    //     email: devUser.email,
    //     password: devUser.password,
    //   },
    // })
  },
})
