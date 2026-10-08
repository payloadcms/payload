import type * as DrizzleKit from 'drizzle-kit/api'

import nodeModule from 'node:module'
import { dynamicImport } from 'payload'

import type { RequireDrizzleKit } from '../types.js'

export const createRequireDrizzleKit = ({
  from,
}: {
  /** Module URL of the adapter that owns the drizzle-kit dependency. */
  from: string
}): RequireDrizzleKit => {
  const load = () => {
    // Preserve Node's loader instead of Webpack's createRequire transform.
    const require = nodeModule.createRequire(from)

    return dynamicImport<typeof DrizzleKit>(require.resolve('drizzle-kit/api'))
  }

  // Keep the 3.x loader synchronous; SQLite tooling methods already return promises.
  return () => ({
    generateDrizzleJson: async (...args) => {
      const { generateSQLiteDrizzleJson } = await load()

      return generateSQLiteDrizzleJson(...args)
    },
    generateMigration: async (...args) => {
      const { generateSQLiteMigration } = await load()

      return generateSQLiteMigration(...args)
    },
    pushSchema: async (...args) => {
      const { pushSQLiteSchema } = await load()
      // Drizzle Kit bundles separate ORM types; this loader is used by SQLite adapters.
      const pushSchema = pushSQLiteSchema as unknown as ReturnType<RequireDrizzleKit>['pushSchema']

      return pushSchema(...args)
    },
  })
}
