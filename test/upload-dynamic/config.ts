import type { CollectionConfig } from 'payload'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { publicVersionedCloudAdapter } from '../plugin-cloud-storage/versionedCloudStorage.js'
import { dynamicMediaDir, dynamicMediaSlug, publicCloudMediaSlug } from './shared.js'
import {
  requestCropTransformer,
  uploadBridgeTransformer,
  uploadCropTransformer,
} from './transformers.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const DynamicMedia: CollectionConfig = {
  slug: dynamicMediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    // Anyone may read the saved file; only a signed-in user may change it with query parameters.
    read: ({ req }) => (req.fileTransform ? Boolean(req.user) : true),
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  upload: { staticDir: dynamicMediaDir },
}

const PublicCloudMedia: CollectionConfig = {
  slug: publicCloudMediaSlug,
  access: { create: () => true, read: () => true, update: () => true },
  fields: [],
  upload: {},
}

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
