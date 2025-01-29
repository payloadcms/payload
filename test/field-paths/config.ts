import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { SanitizedConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { FieldPaths } from './collections/FieldPaths/index.js'

export const HooksConfig: Promise<SanitizedConfig> = buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [FieldPaths],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export default HooksConfig
