import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'
export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Pages, Posts],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  i18n: {
    supportedLanguages: {
      en,
      es,
    },
    fallbackLanguage: 'en',
  },
  onInit: async (payload) => {
    await seed(payload)
  },
  plugins: [
    importExportPlugin({
      overrideExportCollection: (collection) => {
        collection.admin.group = 'System'
        collection.upload.staticDir = path.resolve(dirname, 'uploads')
        return collection
      },
      disableJobsQueue: true,
    }),
    importExportPlugin({
      collections: ['pages'],
      overrideExportCollection: (collection) => {
        collection.slug = 'exports-tasks'
        if (collection.admin) {
          collection.admin.group = 'System'
        }
        collection.upload.staticDir = path.resolve(dirname, 'uploads')
        return collection
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
