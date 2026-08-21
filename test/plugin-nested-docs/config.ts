import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Categories } from './collections/Categories.js'
import { Pages } from './collections/Pages.js'
import { Regions } from './collections/Regions.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'
import { regionsSlug } from './shared.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Pages, Categories, Regions, Users],
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
    nestedDocsPlugin({
      collections: ['pages'],
      generateLabel: (_, doc) => doc.title as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
    }),
    nestedDocsPlugin({
      collections: [regionsSlug],
    }),
    nestedDocsPlugin({
      breadcrumbsFieldSlug: 'categorization',
      collections: ['categories'],
      generateLabel: (_, doc) => doc.name as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.name}`, ''),
      parentFieldSlug: 'owner',
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
