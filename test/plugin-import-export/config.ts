import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { he } from '@payloadcms/translations/languages/he'
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
import {
  exportRenameMap,
  importRenameMap,
  PostsWithColumnMap,
} from './collections/PostsWithColumnMap.js'
import { PostsWithFieldHooks } from './collections/PostsWithFieldHooks.js'
import { PostsWithHooks } from './collections/PostsWithHooks.js'
import { PostsWithLimits } from './collections/PostsWithLimits.js'
import { PostsWithS3 } from './collections/PostsWithS3.js'
import { Users } from './collections/Users.js'
import {
  exportAfterHook,
  exportBeforeHook,
  importAfterHook,
  importBeforeHook,
} from './hookSpies.js'
import { seed } from './seed/index.js'
import {
  customIdPagesSlug,
  postsWithColumnMapSlug,
  postsWithFieldHooksSlug,
  postsWithHooksSlug,
  postsWithS3Slug,
} from './shared.js'

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
    PostsWithHooks,
    PostsWithFieldHooks,
    PostsWithColumnMap,
    Media,
    CustomIdPages,
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'de', label: 'German' },
      { code: 'he', label: 'Hebrew', rtl: true },
    ],
  },
  i18n: {
    supportedLanguages: {
      en,
      es,
      he,
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
          versions: false,
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
          versions: false,
        },
        {
          slug: 'posts-exports-only',
          import: false,
          export: {
            format: 'csv',
          },
          versions: false,
        },
        {
          slug: 'posts-imports-only',
          export: false,
          import: {
            defaultVersionStatus: 'draft',
            disableJobsQueue: true,
          },
          versions: false,
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
          versions: false,
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
          versions: false,
        },
        {
          slug: 'posts-with-limits',
          export: {
            disableJobsQueue: true,
            limit: ({ req }) => {
              if (req.user?.limit) {
                return req.user.limit
              }
              return 5
            },
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
          versions: false,
        },
        {
          slug: 'media',
          versions: false,
        },
        {
          slug: customIdPagesSlug,
          versions: false,
        },
        {
          slug: postsWithHooksSlug,
          export: {
            batchSize: 2,
            disableJobsQueue: true,
            hooks: {
              before: exportBeforeHook,
              after: exportAfterHook,
            },
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-hooks-export'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          import: {
            batchSize: 2,
            disableJobsQueue: true,
            hooks: {
              before: importBeforeHook,
              after: importAfterHook,
            },
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-hooks-import'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          versions: false,
        },
        {
          slug: postsWithFieldHooksSlug,
          export: {
            disableJobsQueue: true,
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-field-hooks-export'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          import: {
            disableJobsQueue: true,
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-field-hooks-import'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          versions: false,
        },
        {
          slug: postsWithColumnMapSlug,
          export: {
            disableJobsQueue: true,
            hooks: {
              before: ({ data }) => {
                return data.map((row) => {
                  const renamed: Record<string, unknown> = {}
                  for (const [key, value] of Object.entries(row)) {
                    renamed[exportRenameMap[key] ?? key] = value
                  }
                  return renamed
                })
              },
            },
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-column-map-export'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          import: {
            disableJobsQueue: true,
            hooks: {
              before: ({ data }) => {
                return data.map((doc) => {
                  const renamed: Record<string, unknown> = {}
                  for (const [key, value] of Object.entries(doc)) {
                    const payloadKey = importRenameMap[key]
                    if (payloadKey) {
                      renamed[payloadKey] = value
                    }
                  }
                  return renamed
                })
              },
            },
            overrideCollection: ({ collection }) => {
              collection.slug = 'posts-with-column-map-import'
              collection.upload.staticDir = path.resolve(dirname, 'uploads')
              return collection
            },
          },
          versions: false,
        },
      ],
    }),
  ],
  storage: [
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
