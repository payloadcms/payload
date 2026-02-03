import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { defaultTimezones } from 'payload/shared'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { createTestBucket } from '../plugin-cloud-storage/utils.js'
import { CustomIdPages } from './collections/CustomIdPages.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { PostsExportsOnly } from './collections/PostsExportsOnly.js'
import { PostsImportsOnly } from './collections/PostsImportsOnly.js'
import { PostsNoJobsQueue } from './collections/PostsNoJobsQueue.js'
import { PostsWithLimits } from './collections/PostsWithLimits.js'
import { PostsWithS3 } from './collections/PostsWithS3.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'
import { customIdPagesSlug, postsWithS3Slug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, './.env.emulated'),
})

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    timezones: {
      supportedTimezones: [...defaultTimezones, { label: 'UTC', value: 'UTC' }],
    },
  },
  collections: [
    Users,
    Pages,
    Posts,
    PostsExportsOnly,
    PostsImportsOnly,
    PostsNoJobsQueue,
    PostsWithLimits,
    PostsWithS3,
    Media,
    CustomIdPages,
  ],
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
    await createTestBucket()
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
        {
          slug: 'posts-with-limits',
          export: {
            disableJobsQueue: true,
            limit: () => 5,
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-limits-export'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          import: {
            disableJobsQueue: true,
            limit: 5,
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-limits-import'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
        },
        {
          slug: 'media',
        },
        {
          slug: customIdPagesSlug,
        },
        {
          slug: postsWithS3Slug,
          export: {
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-s3-export'
              if (collection.admin) {
                collection.admin.group = 'S3 Tests'
              }
              return collection
            },
          },
          import: {
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-s3-import'
              if (collection.admin) {
                collection.admin.group = 'S3 Tests'
              }
              return collection
            },
          },
        },
      ],
    }),
    s3Storage({
      collections: {
        'posts-with-s3-import': true,
        'posts-with-s3-export': true,
      },
      bucket: process.env.S3_BUCKET!,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        region: 'us-east-1',
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
