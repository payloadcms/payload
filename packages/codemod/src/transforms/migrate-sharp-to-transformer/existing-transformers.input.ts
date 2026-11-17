import { customTransformer } from './customTransformer.js'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        imageSizes: [{ name: 'square', height: 400, width: 400 }],
      },
    },
  ],
  upload: {
    abortOnLimit: true,
    transformers: [customTransformer()],
  },
})
