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
        useAsTitle: 'email',
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

    await payload.create({
      collection: slug,
      data: {
        title: 'Hello, world!',
        description: 'This is an example of live preview.',
        slug: 'home',
      },
    })
  },
})
