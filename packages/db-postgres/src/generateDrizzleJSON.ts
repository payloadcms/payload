import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import type { PostgresAdapter } from './types.js'

export const generateDrizzleJSON: PostgresAdapter['generateDrizzleJSON'] =
  function generateDrizzleJSON({ schema }) {
    const { generateDrizzleJson } = require('drizzle-kit/payload')

    return generateDrizzleJson(schema)
  }
