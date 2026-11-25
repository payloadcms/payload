import type * as DrizzleKit from 'drizzle-kit/payload/sqlite'

import nodeModule from 'node:module'
import { dynamicImport } from 'payload'

import type { RequireDrizzleKit } from '../types.js'

type Kit = Awaited<ReturnType<RequireDrizzleKit>>

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
    >(require.resolve('drizzle-kit/payload/sqlite'))

    return {
      generateDrizzleJson,
      // SQLite stores full states, so the result has no `snapshot` and there is no `reconstruct`.
      generateMigration: async (before, after, options) => {
        const result = (await generateMigration(
          before as Parameters<typeof generateMigration>[0],
          after as Parameters<typeof generateMigration>[1],
          options as Parameters<typeof generateMigration>[2],
        )) as Awaited<ReturnType<Kit['generateMigration']>>

        // TODO: remove when drizzle-kit fixes this. The drizzle-kit preview for 1.0.0-rc.6 drops
        // the indexes of a recreated table after recreating it, when they are already gone with
        // the old table. 1.0.0-rc.5 emitted `DROP INDEX IF EXISTS` here.
        return {
          ...result,
          sqlStatements: result.sqlStatements.map((statement) =>
            statement.replace(/^DROP INDEX (?!IF EXISTS )/, 'DROP INDEX IF EXISTS '),
          ),
        }
      },
      // Accepts libsql and D1 drizzle instances. The adapter's instance is typed as a union of
      // every dialect.
      pushSchema: pushSchema as unknown as Kit['pushSchema'],
      upSnapshots: (snapshots) => up(snapshots) as ReturnType<Kit['upSnapshots']>,
    }
  }
