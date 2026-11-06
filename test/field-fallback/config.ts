import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { FallbackValues } from './collections/FallbackValues/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  suite: 'field-fallback',
  disableMCP: true,
  config: {
    collections: [FallbackValues],
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
})
