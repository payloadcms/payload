import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { definePlugin } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Categories } from './collections/Categories.js'
import { Pages } from './collections/Pages.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

const disableDraftsBeforeNestedDocs = definePlugin({
  slug: 'disable-drafts-before-nested-docs',
  order: -10,
  plugin: ({ config }) => ({
    ...config,
    collections: (config.collections || []).map((collection) =>
      collection.slug === Pages.slug
        ? {
            ...collection,
            versions: false,
          }
        : collection,
    ),
  }),
})

const enableDraftsAfterNestedDocs = definePlugin({
  slug: 'enable-drafts-after-nested-docs',
  order: 10,
  plugin: ({ config }) => ({
    ...config,
    collections: (config.collections || []).map((collection) =>
      collection.slug === Pages.slug
        ? {
            ...collection,
            versions: {
              drafts: {
                schedulePublish: true,
              },
            },
          }
        : collection,
    ),
  }),
})

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Pages, Categories, Users],
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
    disableDraftsBeforeNestedDocs(),
    nestedDocsPlugin({
      collections: ['pages'],
      generateLabel: (_, doc) => doc.title as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
    }),
    nestedDocsPlugin({
      breadcrumbsFieldSlug: 'categorization',
      collections: ['categories'],
      generateLabel: (_, doc) => doc.name as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.name}`, ''),
      parentFieldSlug: 'owner',
    }),
    enableDraftsAfterNestedDocs(),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
