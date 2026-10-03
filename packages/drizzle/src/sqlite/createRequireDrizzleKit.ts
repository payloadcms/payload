import nodeModule from 'node:module'

import type { RequireDrizzleKit } from '../types.js'

export const createRequireDrizzleKit =
  ({
    from,
  }: {
    /** Module URL of the adapter that owns the drizzle-kit dependency. */
    from: string
  }): RequireDrizzleKit =>
  () => {
    // Use the default import to preserve Node's loader instead of Webpack's createRequire transform.
    const require = nodeModule.createRequire(from)
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
