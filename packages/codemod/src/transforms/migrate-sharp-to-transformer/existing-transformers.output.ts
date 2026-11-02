import { customTransformer } from './customTransformer.js'
import { buildConfig } from 'payload'
import { sharpTransformer } from '@payloadcms/transformer-sharp'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {},
    },
  ],
  upload: {
    abortOnLimit: true,
    transformers: [customTransformer(), sharpTransformer({ collections: { media: { variants: [{ name: 'square', height: 400, width: 400 }] } } })],
  },
})
