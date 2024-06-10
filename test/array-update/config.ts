import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
