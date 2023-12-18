import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export default buildConfigWithDefaults({
  collections: [
    {
      fields: [
        {
          name: 'title',
          required: true,
          type: 'text',
        },
        {
          name: 'throwAfterChange',
          defaultValue: false,
          hooks: {
            afterChange: [
              ({ value }) => {
                if (value) {
                  throw new Error('throw after change')
                }
              },
            ],
          },
          type: 'checkbox',
        },
      ],
      slug: 'posts',
    },
    {
      fields: [
        {
          name: 'relationship',
          relationTo: 'relation-b',
          type: 'relationship',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
      labels: {
        plural: 'Relation As',
        singular: 'Relation A',
      },
      slug: 'relation-a',
    },
    {
      fields: [
        {
          name: 'relationship',
          relationTo: 'relation-a',
          type: 'relationship',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
      labels: {
        plural: 'Relation Bs',
        singular: 'Relation B',
      },
      slug: 'relation-b',
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
  },
})

export const postDoc = {
  title: 'test post',
}
