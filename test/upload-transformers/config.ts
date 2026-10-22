import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { OutsideFitMedia } from './collections/OutsideFitMedia/index.js'
import { ResizePreviewMedia } from './collections/ResizePreviewMedia/index.js'
import { TransformerMedia } from './collections/TransformerMedia/index.js'
import { VariantMedia } from './collections/VariantMedia/index.js'
import { outsideFitMediaSlug, resizePreviewMediaSlug, variantMediaSlug } from './shared.js'
import { countingDynamicOnlySharp, testTransformers } from './transformerFixtures.js'

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
    collections: [TransformerMedia, ResizePreviewMedia, OutsideFitMedia, VariantMedia],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [
        sharpTransformer({
          dynamic: { collections: [resizePreviewMediaSlug] },
          sharp: countingDynamicOnlySharp,
        }),
        sharpTransformer({
          slug: 'sharp-outside',
          dynamic: { collections: [outsideFitMediaSlug], fit: 'outside' },
        }),
        sharpTransformer({
          slug: 'sharp-variants',
          collections: {
            [variantMediaSlug]: { variants: [{ name: 'thumbnail', height: 100, width: 100 }] },
          },
        }),
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
