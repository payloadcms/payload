import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { arraySlug, complexSlug } from './shared.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
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
              name: 'required',
              type: 'text',
              required: true,
            },
            {
              name: 'optional',
              type: 'text',
            },
            {
              name: 'innerArrayOfFields',
              type: 'array',
              fields: [
                {
                  name: 'required',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'optional',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: complexSlug,
      fields: [
        {
          name: 'localizedArray',
          type: 'array',
          localized: true,
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'groupArray',
              type: 'array',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'localizedGroup',
          type: 'group',
          localized: true,
          fields: [
            {
              name: 'localizedGroupArray',
              type: 'array',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'content',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'innerArray',
                  type: 'array',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
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
