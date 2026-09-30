import { cloudinaryTransformer } from '@payloadcms/transformer-cloudinary'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { OutsideFitMedia } from './collections/OutsideFitMedia/index.js'
import { ResizePreviewMedia } from './collections/ResizePreviewMedia/index.js'
import { TransformerMedia } from './collections/TransformerMedia/index.js'
import { outsideFitMediaSlug, resizePreviewMediaSlug } from './shared.js'
import { isCloudinaryEnabled, publicServerURL, testTransformers } from './transformerFixtures.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'upload-transformers',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [TransformerMedia, ResizePreviewMedia, OutsideFitMedia],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [
        // Cloudinary replaces Sharp rather than running alongside it: core runs every eligible
        // transformer's `transformFile` with the upload bridge's task options, and Sharp can't
        // read Cloudinary's.
        ...(isCloudinaryEnabled
          ? [
              cloudinaryTransformer({
                debug: true,
                dynamic: {
                  collections: [resizePreviewMediaSlug],
                  sourceURL: ({ collectionSlug, filename }) =>
                    `${publicServerURL}/api/${collectionSlug}/file/${encodeURIComponent(filename)}`,
                },
                url: process.env.CLOUDINARY_URL,
              }),
            ]
          : [
              sharpTransformer({ dynamic: { collections: [resizePreviewMediaSlug] } }),
              sharpTransformer({
                slug: 'sharp-outside',
                dynamic: { collections: [outsideFitMediaSlug], fit: 'outside' },
              }),
            ]),
        ...testTransformers,
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
})
