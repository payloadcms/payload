import type { StorageAdapter } from 'payload'

import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { APIError } from 'payload'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser, regularUser } from '../../credentials.js'
import { Users } from '../collections/Users.js'
import { videosMissingBucketSlug, videosSlug, videosWithDraftsSlug } from '../shared.js'
import { Videos } from './collections/Videos.js'
import { VideosMissingBucket } from './collections/VideosMissingBucket.js'
import { VideosWithDrafts } from './collections/VideosWithDrafts.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({
  path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated'),
})

export const maxActiveSessions = 3

/**
 * Lets tests force the provider initiation to fail through the `x-fail-initiate` header:
 * `permanent` throws a 4xx `APIError`, `temporary` throws a plain network-style error.
 * Registered as a storage entry after `s3Storage` because storage adapters run after plugins.
 */
const failInitiationStorage: StorageAdapter = {
  name: 'fail-initiation',
  collections: [videosSlug],
  init: (config) => {
    const upload = config.collections?.find(({ slug }) => slug === videosSlug)?.upload
    const segmented = typeof upload === 'object' ? upload.uploadInstructions?.segmented : undefined

    if (segmented) {
      const { initiate } = segmented

      segmented.initiate = (args) => {
        const failure = args.req.headers.get('x-fail-initiate')

        if (failure === 'permanent') {
          throw new APIError('The bucket rejected the upload.', 400)
        }

        if (failure === 'temporary') {
          throw new Error('Network unavailable')
        }

        return initiate(args)
      }
    }

    return config
  },
}

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname, '..'),
      },
    },
    collections: [Videos, VideosWithDrafts, VideosMissingBucket, Users],
    storage: [
      s3Storage({
        bucket: process.env.S3_BUCKET!,
        clientUploads: {
          access: ({ req }) => !req.headers.get('x-disallow-access'),
        },
        collections: {
          [videosSlug]: true,
          [videosWithDraftsSlug]: true,
        },
        config: {
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          },
          endpoint: process.env.S3_ENDPOINT,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          region: process.env.S3_REGION,
        },
      }),
      failInitiationStorage,
      s3Storage({
        bucket: 'payload-upload-sessions-missing-bucket',
        clientUploads: true,
        collections: {
          [videosMissingBucketSlug]: true,
        },
        config: {
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          },
          endpoint: process.env.S3_ENDPOINT,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          region: process.env.S3_REGION,
        },
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      sessions: {
        maxActive: maxActiveSessions,
      },
    },
  },
  seed: async (payload) => {
    for (const user of [devUser, regularUser]) {
      await payload.create({
        collection: 'users',
        data: { email: user.email, password: user.password },
        overrideAccess: true,
      })
    }
  },
  suite: 'storage-s3-upload-sessions',
})
