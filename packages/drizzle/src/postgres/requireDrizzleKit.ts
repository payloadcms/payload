import type * as DrizzleKit from 'drizzle-kit/payload/postgres'

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
    const { generateDrizzleJson, generateMigration, pushSchema, up } = await dynamicImport<
      typeof DrizzleKit
    >(require.resolve('drizzle-kit/payload/postgres'))

    return {
      generateDrizzleJson,
      generateMigration: async (before, after, options) => {
        const statements = await generateMigration(
          before as Parameters<typeof generateMigration>[0],
          after as Parameters<typeof generateMigration>[1],
          options as Parameters<typeof generateMigration>[2],
        )

        // Payload can connect to a pre-created schema, including after dropDatabase recreates it.
        return statements.map((statement) =>
          statement.replace(/^CREATE SCHEMA (?!IF NOT EXISTS )/, 'CREATE SCHEMA IF NOT EXISTS '),
        )
      },
      // Drizzle Kit bundles separate ORM types; the owning adapter selects the matching dialect.
      pushSchema: pushSchema as unknown as Awaited<ReturnType<RequireDrizzleKit>>['pushSchema'],
      upSnapshot: (snapshot) => up(snapshot).snapshot,
    }
  }

export const requireDrizzleKit = createRequireDrizzleKit({ from: import.meta.url })
