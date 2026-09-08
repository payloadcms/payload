import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export const slug = 'global'
export const arraySlug = 'array'

export const accessControlSlug = 'access-control'

export const defaultValueSlug = 'default-value'

export const englishLocale = 'en'
export const spanishLocale = 'es'

export const globalsEndpoint = 'hello-world'

const access = {
  read: () => true,
  update: () => true,
}

export default buildConfigWithDefaults({
  suite: 'globals',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    globals: [
      {
        slug,
        access,
        fields: [
          {
            name: 'json',
            type: 'json',
          },
          {
            name: 'title',
            type: 'text',
          },
        ],
        versions: false,
      },
      {
        slug: arraySlug,
        access,
        fields: [
          {
            name: 'array',
            type: 'array',
            fields: [
              {
                name: 'text',
                type: 'text',
              },
            ],
            localized: true,
          },
        ],
        versions: false,
      },
      {
        slug: defaultValueSlug,
        fields: [
          {
            name: 'text',
            type: 'text',
            defaultValue: 'test',
          },
          {
            name: 'group',
            type: 'group',
            fields: [
              {
                name: 'text',
                type: 'text',
                defaultValue: 'test',
              },
            ],
          },
        ],
        versions: false,
      },
      {
        slug: accessControlSlug,
        access: {
          read: ({ req: { user } }) => {
            if (user) {
              return true
            }

            return {
              enabled: {
                equals: true,
              },
            }
          },
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'enabled',
            type: 'checkbox',
          },
        ],
        versions: false,
      },
      {
        slug: 'without-graphql',
        access,
        fields: [],
        graphQL: false,
        versions: false,
      },
    ],
    localization: {
      defaultLocale: englishLocale,
      locales: [englishLocale, spanishLocale],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.updateGlobal({
      slug: accessControlSlug,
      data: {
        title: 'hello',
      },
    })
  },
})
