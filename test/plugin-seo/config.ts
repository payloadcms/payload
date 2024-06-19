import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { seoPlugin } from '@payloadcms/plugin-seo'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  collections: [Users, Pages, Media],
  i18n: {
    supportedLanguages: {
      en,
      es,
    },
    translations: {
      es: {
        'plugin-seo': {
          autoGenerate: 'Auto-génerar',
        },
      },
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await seed(payload)
  },
  plugins: [
    seoPlugin({
      collections: ['pages'],
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
