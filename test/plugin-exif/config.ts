import { exifPlugin } from '@payloadcms/plugin-exif'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'media',
      fields: [],
      upload: { staticDir: path.resolve(dirname, 'media') },
    },
  ],
  plugins: [exifPlugin({ collections: ['media'] })],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
