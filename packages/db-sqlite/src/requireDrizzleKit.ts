import type { RequireDrizzleKit } from '@payloadcms/drizzle/types'

import { createRequire } from 'module'

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
