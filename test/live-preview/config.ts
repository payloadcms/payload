import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export interface Post {
  createdAt: Date
  description: string
  id: string
  title: string
  updatedAt: Date
}

export const slug = 'pages'
export default buildConfigWithDefaults({
  admin: {},
  cors: ['http://localhost:3001'],
  csrf: ['http://localhost:3001'],
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'title',
      },
      fields: [],
    },
    {
      slug,
      access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
      },
      admin: {
        livePreview: {
          url: 'http://localhost:3001',
          breakpoints: [
            {
              label: 'Mobile',
              name: 'mobile',
              width: 375,
              height: 667,
            },
            // {
            //   label: 'Desktop',
            //   name: 'desktop',
            //   width: 1440,
            //   height: 900,
            // },
          ],
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          admin: {
            position: 'sidebar',
          },
        },
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            {
              slug: 'hero',
              labels: {
                singular: 'Hero',
                plural: 'Hero',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          name: 'featuredPosts',
          type: 'relationship',
          relationTo: 'posts',
          hasMany: true,
        },
      ],
    },
    {
      slug: 'posts',
      access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
      },
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const post1 = await payload.create({
      collection: 'posts',
      data: {
        title: 'Post 1',
      },
    })

    await payload.create({
      collection: slug,
      data: {
        title: 'Hello, world!',
        description: 'This is an example of live preview.',
        slug: 'home',
        layout: [
          {
            blockType: 'hero',
            title: 'Hello, world!',
            description: 'This is an example of live preview.',
          },
        ],
        featuredPosts: [post1.id],
      },
    })
  },
})
