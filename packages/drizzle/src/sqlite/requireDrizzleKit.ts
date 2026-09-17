import { createRequire } from 'module'

import type { RequireDrizzleKit } from '../types.js'

const require = createRequire(import.meta.url)
const drizzleKitAPISpecifier = ['drizzle-kit', 'api'].join('/')

export const requireDrizzleKit: RequireDrizzleKit = () => {
  const { generateSQLiteDrizzleJson, generateSQLiteMigration, pushSQLiteSchema } = require(
    drizzleKitAPISpecifier,
  )

  return {
    generateDrizzleJson: generateSQLiteDrizzleJson,
    generateMigration: generateSQLiteMigration,
    pushSchema: pushSQLiteSchema,
  }
}
