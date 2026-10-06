import type * as DrizzleKit from 'drizzle-kit/api'

import nodeModule from 'node:module'
import { dynamicImport } from 'payload'

import type { RequireDrizzleKit } from '../types.js'

export const createRequireDrizzleKit =
  ({
    from,
  }: {
    /** Module URL of the adapter that owns the drizzle-kit dependency. */
    from: string
  }): RequireDrizzleKit =>
  async () => {
    // Use the default import to preserve Node's loader instead of Webpack's createRequire transform.
    const require = nodeModule.createRequire(from)
    const { generateDrizzleJson, generateMigration, pushSchema, upPgSnapshot } =
      await dynamicImport<typeof DrizzleKit>(require.resolve('drizzle-kit/api'))

    return {
      generateDrizzleJson,
      generateMigration,
      // Drizzle Kit bundles separate ORM types; the owning adapter selects the matching dialect.
      pushSchema: pushSchema as unknown as Awaited<ReturnType<RequireDrizzleKit>>['pushSchema'],
      upSnapshot: upPgSnapshot,
    }
  }

export const requireDrizzleKit = createRequireDrizzleKit({ from: import.meta.url })
