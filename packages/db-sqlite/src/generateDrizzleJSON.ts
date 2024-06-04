import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import type { SQLiteAdapter } from './types.js'

export const generateDrizzleJSON: SQLiteAdapter['generateDrizzleJSON'] =
  function generateDrizzleJSON({ schema }) {
    const { generateDrizzleJson } = require('drizzle-kit/payload')

    return generateDrizzleJson(schema)
  }
