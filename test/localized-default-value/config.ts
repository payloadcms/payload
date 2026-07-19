import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { collectionSlug, defaultLocale, spanishLocale, staticDefaultValue } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: collectionSlug,
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true,
      },
      fields: [
        {
          name: 'title',
          localized: true,
          type: 'text',
        },
        {
          name: 'myField',
          defaultValue: staticDefaultValue,
          localized: true,
          type: 'text',
        },
        {
          name: 'localeAwareField',
          defaultValue: ({ locale }) => `default-${locale}`,
          localized: true,
          type: 'text',
        },
      ],
      versions: false,
    },
  ],
  localization: {
    defaultLocale,
    fallback: false,
    locales: [defaultLocale, spanishLocale],
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
