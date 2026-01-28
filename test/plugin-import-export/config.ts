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
import { PostsExportsOnly } from './collections/PostsExportsOnly.js'
import { PostsImportsOnly } from './collections/PostsImportsOnly.js'
import { PostsNoJobsQueue } from './collections/PostsNoJobsQueue.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Pages, Posts, PostsExportsOnly, PostsImportsOnly, PostsNoJobsQueue],
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
  jobs: {
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      if (defaultJobsCollection.admin) {
        defaultJobsCollection.admin.group = 'Jobs'
        defaultJobsCollection.admin.hidden = false
      }

      return defaultJobsCollection
    },
  },
  onInit: async (payload) => {
    await seed(payload)
  },
  plugins: [
    importExportPlugin({
      debug: true,
      collections: [
        {
          slug: 'pages',
          export: {
            overrideCollection: ({ collection }) => {
              if (collection.admin) {
                collection.admin.group = 'System'
              }
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          import: {
            overrideCollection: ({ collection }) => {
              if (collection.admin) {
                collection.admin.group = 'System'
              }
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
        },
        {
          slug: 'posts',
          export: {
            disableJobsQueue: true,
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-export'
              if (collection.admin) {
                collection.admin.group = 'Posts'
              }
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          import: {
            disableJobsQueue: true,
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-import'
              if (collection.admin) {
                collection.admin.group = 'Posts'
              }
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
        },
        {
          slug: 'posts-exports-only',
          import: false,
          export: {
            format: 'csv',
            disableSave: true,
          },
        },
        {
          slug: 'posts-imports-only',
          export: false,
          import: {
            disableJobsQueue: true,
          },
        },
        {
          slug: 'posts-no-jobs-queue',
          import: {
            disableJobsQueue: true,
          },
          export: {
            disableJobsQueue: true,
            format: 'csv',
            disableSave: true,
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-no-jobs-queue-export'
              if (collection.admin) {
                collection.admin.group = 'Posts No Jobs Queue'
              }
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
        },
      ],
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
