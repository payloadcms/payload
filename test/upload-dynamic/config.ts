import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { publicVersionedCloudAdapter } from '../plugin-cloud-storage/versionedCloudStorage.js'
import { DynamicMedia } from './collections/DynamicMedia.js'
import { PublicCloudMedia } from './collections/PublicCloudMedia.js'
import { publicCloudMediaSlug } from './shared.js'
import {
  requestCropTransformer,
  uploadBridgeTransformer,
  uploadCropTransformer,
} from './transformers.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  suite: 'upload-dynamic',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [DynamicMedia, PublicCloudMedia],
    plugins: [
      cloudStoragePlugin({
        collections: {
          [publicCloudMediaSlug]: {
            adapter: publicVersionedCloudAdapter,
            disablePayloadAccessControl: true,
          },
        },
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [uploadCropTransformer, uploadBridgeTransformer, requestCropTransformer],
    },
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
