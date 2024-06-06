import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import type { GenerateDrizzleJSON } from './types.js'

export const generateDrizzleJSON: GenerateDrizzleJSON = function generateDrizzleJSON({ schema }) {
  const { generateDrizzleJson } = require('drizzle-kit/payload')

  return generateDrizzleJson(schema)
}
