import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export interface Post {
  createdAt: Date
  description: string
  id: string
  title: string
  updatedAt: Date
}
export const slug = 'live-preview'
export default buildConfigWithDefaults({
  admin: {},
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
      admin: {
        livePreview: {
          url: 'http://localhost:3001',
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
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
        title: 'title',
        description: 'description',
      },
    })
  },
})
