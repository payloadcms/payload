import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  globals: [],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
