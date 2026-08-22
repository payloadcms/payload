import sharp from 'sharp'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: {
        crop: false,
        imageSizes: [{ name: 'square', height: 400, width: 400 }],
        resizeOptions: {
          width: 200,
          height: 200,
        },
        staticDir: 'media',
      },
    },
  ],
  sharp,
})
