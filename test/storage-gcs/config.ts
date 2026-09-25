import { gcsStorage } from '@payloadcms/storage-gcs'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaWithAlwaysInsertFields } from './collections/MediaWithAlwaysInsertFields.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithPrefixSlug,
  prefix,
} from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const uploadOptions = {
  transformers: [
    sharpTransformer({
      collections: {
        [mediaSlug]: {
          imageSizes: [
            { height: 400, width: 400, crop: 'center', name: 'square' },
            { width: 900, height: 450, crop: 'center', name: 'sixteenByNineMedium' },
          ],
          resizeOptions: {
            position: 'center',
            width: 200,
            height: 200,
          },
        },
      },
    }),
  ],
}

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated'),
})

export default buildConfigWithDefaults({
  suite: 'storage-gcs',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Media, MediaWithAlwaysInsertFields, MediaWithPrefix, Users],
    storage: [
      gcsStorage({
        bucket: process.env.GCS_BUCKET,
        collections: {
          [mediaSlug]: true,
          [mediaWithPrefixSlug]: {
            prefix,
          },
        },
        options: {
          apiEndpoint: process.env.GCS_ENDPOINT,
          projectId: process.env.GCS_PROJECT_ID,
        },
      }),
      // Plugin disabled: the prefix field should still be inserted by default
      gcsStorage({
        bucket: process.env.GCS_BUCKET,
        collections: {
          [mediaWithAlwaysInsertFieldsSlug]: {
            prefix: '',
          },
        },
        enabled: false,
        options: {
          apiEndpoint: process.env.GCS_ENDPOINT,
          projectId: process.env.GCS_PROJECT_ID,
        },
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: uploadOptions,
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })
  },
})
