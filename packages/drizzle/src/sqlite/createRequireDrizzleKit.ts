import type * as DrizzleKit from 'drizzle-kit/payload/sqlite'
import type { SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'
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
    >(require.resolve('drizzle-kit/payload/sqlite'))

    return {
      generateDrizzleJson,
      generateMigration,
      // drizzle-kit v1's SQLite push takes a raw `SQLiteClient` ({ query, run, batch }) rather
      // than the drizzle instance (and has no entities filter). We adapt the drizzle instance
      // into that shape via its driver-agnostic raw-SQL methods so this works for libsql and D1.
      pushSchema: (schema, drizzle, _entitiesConfig, migrationsConfig) => {
        const db = drizzle as unknown as {
          all: <T>(query: SQL) => Promise<T[]>
          run: (query: SQL) => Promise<unknown>
        }

        const client = {
          batch: async (statements: string[]) => {
            for (const statement of statements) {
              await db.run(sql.raw(statement))
            }
          },
          query: <T>(queryString: string) => db.all<T>(sql.raw(queryString)),
          run: async (queryString: string) => {
            await db.run(sql.raw(queryString))
          },
        }

        return pushSchema(schema, client, migrationsConfig)
      },
      upSnapshot: (snapshot) => up(snapshot as Parameters<typeof up>[0]),
    }
  }
