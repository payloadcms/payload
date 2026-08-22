import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { KitchenSinkMedia } from './collections/KitchenSinkMedia/index.js'
import { ResizePreviewMedia } from './collections/ResizePreviewMedia/index.js'
import { TransformerMedia } from './collections/TransformerMedia/index.js'
import { kitchenSinkSharpTransformer } from './kitchenSinkSharpTransformer.js'
import { testTransformers } from './transformerFixtures.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [TransformerMedia, ResizePreviewMedia, KitchenSinkMedia],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  upload: {
    transformers: [sharpTransformer(), kitchenSinkSharpTransformer, ...testTransformers],
  },
})
