import type { RequireDrizzleKit } from '../types.js'

export const requireDrizzleKit: RequireDrizzleKit = () => {
  const { createRequire } = require('module')
  const require = createRequire(import.meta.url)
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
