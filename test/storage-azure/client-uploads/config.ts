import type { CollectionConfig } from 'payload'

import { azureStorage } from '@payloadcms/storage-azure'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { Media } from '../collections/Media.js'
import { MediaWithPrefix } from '../collections/MediaWithPrefix.js'
import { Users } from '../collections/Users.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from '../shared.js'
import { MediaHeaderOnly, mediaHeaderOnlySlug } from './collections/MediaHeaderOnly.js'
import {
  MediaHeaderOnlyWithSizes,
  mediaHeaderOnlyWithSizesSlug,
} from './collections/MediaHeaderOnlyWithSizes.js'
import { MediaWithDocPrefix, mediaWithDocPrefixSlug } from './collections/MediaWithDocPrefix.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const enableAzureClientUploads = (collection: CollectionConfig): CollectionConfig => ({
  ...collection,
  upload: {
    ...(typeof collection.upload === 'object' ? collection.upload : {}),
    allowRestrictedFileTypes: true,
  },
})

dotenv.config({
  path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated'),
})

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname, '..'),
      },
    },
    collections: [
      enableAzureClientUploads(Media),
      enableAzureClientUploads(MediaWithPrefix),
      enableAzureClientUploads(MediaWithDocPrefix),
      enableAzureClientUploads(MediaHeaderOnly),
      enableAzureClientUploads(MediaHeaderOnlyWithSizes),
      Users,
    ],
    storage: [
      azureStorage({
        allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
        baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL!,
        clientUploads: true,
        collections: {
          [mediaHeaderOnlySlug]: true,
          [mediaHeaderOnlyWithSizesSlug]: true,
          [mediaSlug]: true,
          // Configure a collection-level prefix on this slug to test that
          // a custom `prefix.defaultValue` is contained beneath the static prefix
          [mediaWithDocPrefixSlug]: {
            prefix: 'docprefix-collection',
          },
          [mediaWithPrefixSlug]: {
            prefix,
          },
        },
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME!,
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [
        sharpTransformer({
          collections: {
            [mediaHeaderOnlyWithSizesSlug]: {
              variants: [
                {
                  name: 'thumbnail',
                  height: 300,
                  width: 400,
                },
              ],
            },
          },
          dynamic: { collections: [mediaWithDocPrefixSlug] },
        }),
        // Declines every upload, so a client upload of a type it lists must still not be read.
        {
          slug: 'declining',
          canTransform: () => false,
          mimeTypes: ['audio/*'],
          transformFile: () => Promise.reject(new Error('A declining transformer ran')),
        },
        {
          slug: 'uppercase-text',
          mimeTypes: ['text/plain'],
          transformFile: async ({ source }) => ({
            file: new File(
              [
                new TextDecoder()
                  .decode(await source.arrayBuffer({ maxBytes: 1024 * 1024 }))
                  .toUpperCase(),
              ],
              source.filename,
              { type: source.mimeType },
            ),
            status: 'complete',
          }),
        },
      ],
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
  suite: 'storage-azure-client-uploads',
})
