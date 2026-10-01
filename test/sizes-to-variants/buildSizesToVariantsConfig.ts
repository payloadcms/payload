import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { mediaSlug, variantName } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const buildSizesToVariantsConfig = ({
  legacySizes,
  staticDirName,
  suite,
}: {
  legacySizes: boolean
  staticDirName: string
  suite: string
}) =>
  buildConfigWithDefaults({
    config: {
      collections: [
        {
          slug: 'users',
          auth: true,
          fields: [],
        },
        {
          slug: mediaSlug,
          access: {
            read: () => true,
          },
          fields: [],
          upload: {
            staticDir: path.resolve(dirname, staticDirName),
          },
          versions: true,
        },
      ],
      upload: {
        legacySizes,
        transformers: [
          sharpTransformer({
            collections: {
              [mediaSlug]: { variants: [{ name: variantName, height: 40, width: 40 }] },
            },
            sharp,
          }),
        ],
      },
    },
    suite,
  })
