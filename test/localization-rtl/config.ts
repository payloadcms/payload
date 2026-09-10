import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { ar } from '@payloadcms/translations/languages/ar'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Posts } from './collections/posts.js'
import { Users } from './collections/users.js'
import deepMerge from './deepMerge.js'

export default buildConfigWithDefaults({
  suite: 'localization-rtl',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Users, Posts],
    /*i18n: {
    fallbackLng: 'en', // default
    debug: false, // default
    resources: {
      ar: deepMerge(en, ar),
    },
  },*/
    i18n: {
      supportedLanguages: {
        ar,
        de,
        en,
        es,
      },
    },
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: [
        {
          code: 'en',
          label: 'English',
        },
        {
          code: 'ar',
          label: 'Arabic',
          rtl: true,
        },
      ],
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
  },
})
