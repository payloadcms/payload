import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { camelCaseVariantName, mediaSlug, variantName } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  config: {
    collections: [
      {
        slug: 'users',
        auth: true,
        fields: [],
      },
      {
        slug: mediaSlug,
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
        versions: true,
      },
    ],
    upload: {
      transformers: [
        sharpTransformer({
          collections: {
            [mediaSlug]: {
              variants: [
                { name: variantName, height: 40, width: 40 },
                { name: camelCaseVariantName, width: 60 },
              ],
            },
          },
          sharp,
        }),
      ],
    },
  },
  suite: 'sizes-to-variants',
})
