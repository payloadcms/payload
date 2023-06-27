import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

import { buildConfig } from 'payload/config'

import { Pages } from './collections/Pages'

export default buildConfig({
  collections: [Pages],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
