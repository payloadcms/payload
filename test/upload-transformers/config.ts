import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { ContractMedia } from './collections/ContractMedia/index.js'
import { ConvertedVariantMedia } from './collections/ConvertedVariantMedia/index.js'
import { OutsideFitMedia } from './collections/OutsideFitMedia/index.js'
import { RequestVariantsMedia } from './collections/RequestVariantsMedia/index.js'
import { ResizePreviewMedia } from './collections/ResizePreviewMedia/index.js'
import { SeveralOwnersMedia } from './collections/SeveralOwnersMedia/index.js'
import { TransformerMedia } from './collections/TransformerMedia/index.js'
import { VariantMedia } from './collections/VariantMedia/index.js'
import { contractTransformers } from './contractFixtures.js'
import {
  convertedVariantMediaSlug,
  outsideFitMediaSlug,
  resizePreviewMediaSlug,
  severalOwnersMediaSlug,
  variantMediaSlug,
} from './shared.js'
import {
  countingDynamicOnlySharp,
  pdfPreviewTransformer,
  requestVariantsTransformer,
  testTransformers,
} from './transformerFixtures.js'

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
    collections: [
      TransformerMedia,
      ResizePreviewMedia,
      OutsideFitMedia,
      VariantMedia,
      ConvertedVariantMedia,
      RequestVariantsMedia,
      SeveralOwnersMedia,
      ContractMedia,
    ],
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
            [convertedVariantMediaSlug]: {
              variants: [
                { name: 'webp', formatOptions: { format: 'webp' }, height: 50, width: 50 },
              ],
            },
            [severalOwnersMediaSlug]: {
              variants: [{ name: 'thumbnail', height: 100, width: 100 }],
            },
          },
        }),
        requestVariantsTransformer,
        ...testTransformers,
        ...contractTransformers,
        pdfPreviewTransformer,
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
