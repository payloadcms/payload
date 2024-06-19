import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import type { SQLiteAdapter } from './types.js'

export const generateDrizzleJSON: SQLiteAdapter['generateDrizzleJSON'] =
  function generateDrizzleJSON({ schema }) {
    const { generateSQLiteDrizzleJson } = require('drizzle-kit/payload')

    return generateSQLiteDrizzleJson(schema)
  }
