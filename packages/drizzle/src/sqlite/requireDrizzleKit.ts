import { createRequire } from 'module'

import type { RequireDrizzleKit } from '../types.js'

const require = createRequire(import.meta.url)

export const requireDrizzleKit: RequireDrizzleKit = () => {
  const {
    generateSQLiteDrizzleJson,
    generateSQLiteMigration,
    pushSQLiteSchema,
  } = require('drizzle-kit/api')

  return {
    generateDrizzleJson: generateSQLiteDrizzleJson,
    generateMigration: generateSQLiteMigration,
    pushSchema: pushSQLiteSchema,
  }
}
