import sharp from 'sharp'
import { buildConfig } from 'payload'
import { sharpTransformer } from '@payloadcms/transformer-sharp'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        staticDir: 'media',
      },
    },
  ],
  upload: { transformers: [sharpTransformer({ sharp, collections: { media: { resizeOptions: {
        width: 200,
        height: 200,
    }, imageSizes: [{ name: 'square', height: 400, width: 400 }], crop: false } } })] },
})
