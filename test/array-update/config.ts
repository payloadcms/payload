import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { arraySlug } from './shared.js'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: arraySlug,
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
