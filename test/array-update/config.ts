import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'arrays',
      fields: [
        {
          name: 'arrayOfFields',
          type: 'array',
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              type: 'text',
              name: 'required',
              required: true,
            },
            {
              type: 'text',
              name: 'optional',
            },
            {
              name: 'innerArrayOfFields',
              type: 'array',
              fields: [
                {
                  type: 'text',
                  name: 'required',
                  required: true,
                },
                {
                  type: 'text',
                  name: 'optional',
                },
              ],
            },
            {
              type: 'group',
              name: 'rowGroupFields',
              fields: [
                {
                  type: 'text',
                  name: 'rowGroupTextField',
                },
              ],
            },
          ],
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
  },
})
