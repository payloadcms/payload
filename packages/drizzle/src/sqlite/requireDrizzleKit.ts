import type { SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'
import { createRequire } from 'module'

import type { RequireDrizzleKit } from '../types.js'

const require = createRequire(import.meta.url)

export const requireDrizzleKit: RequireDrizzleKit = () => {
  const {
    generateDrizzleJson,
    generateMigration,
    pushSchema,
    up,
  } = require('drizzle-kit/payload/sqlite')

  return {
    generateDrizzleJson,
    generateMigration,
    // drizzle-kit v1's SQLite push takes a raw `SQLiteClient` ({ query, run, batch }) rather
    // than the drizzle instance (and has no entities filter). We adapt the drizzle instance
    // into that shape via its driver-agnostic raw-SQL methods so this works for libsql and D1.
    pushSchema: (schema, drizzle, _entitiesConfig, migrationsConfig) => {
      const db = drizzle as unknown as {
        all: (query: SQL) => Promise<unknown[]>
        run: (query: SQL) => Promise<unknown>
      }

      const client = {
        batch: async (statements: string[]) => {
          for (const statement of statements) {
            await db.run(sql.raw(statement))
          }
        },
        query: (queryString: string) => db.all(sql.raw(queryString)),
        run: async (queryString: string) => {
          await db.run(sql.raw(queryString))
        },
      }

      return pushSchema(schema, client, migrationsConfig)
    },
    upSnapshot: (snapshot) => up(snapshot).snapshot,
  }
}
