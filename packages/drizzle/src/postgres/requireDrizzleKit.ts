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
    // Postgres snapshot generation and upgrading must remain synchronous in 3.x.
    const {
      generateDrizzleJson,
      generateMigration,
      pushSchema,
      upPgSnapshot,
    } = require('drizzle-kit/api')

    return {
      generateDrizzleJson,
      generateMigration,
      pushSchema,
      upSnapshot: upPgSnapshot,
    }
  }

export const requireDrizzleKit = createRequireDrizzleKit({ from: import.meta.url })
