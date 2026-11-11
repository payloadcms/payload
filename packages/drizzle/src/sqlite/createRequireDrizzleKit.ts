import type * as DrizzleKit from 'drizzle-kit/api'

import { sql } from 'drizzle-orm'
import nodeModule from 'node:module'
import { dynamicImport } from 'payload'

import type { RequireDrizzleKit, SQLiteDB } from '../types.js'
import type { SQLiteRowIDSnapshot } from './migrateRowIDs.js'

import { migrateRowIDs } from './migrateRowIDs.js'

export const createRequireDrizzleKit =
  ({
    from,
    migrateBranchingRowIDs = false,
  }: {
    /** Module URL of the adapter that owns the drizzle-kit dependency. */
    from: string
    /** Enable the libSQL row ID conversion; D1 has different migration constraints. */
    migrateBranchingRowIDs?: boolean
  }): RequireDrizzleKit =>
  async () => {
    // Use the default import to preserve Node's loader instead of Webpack's createRequire transform.
    const require = nodeModule.createRequire(from)
    const { generateSQLiteDrizzleJson, generateSQLiteMigration, pushSQLiteSchema } =
      await dynamicImport<typeof DrizzleKit>(require.resolve('drizzle-kit/api'))

    // Drizzle Kit bundles separate ORM types; the owning adapter selects the matching dialect.
    const pushSchema = pushSQLiteSchema as unknown as Awaited<
      ReturnType<RequireDrizzleKit>
    >['pushSchema']

    return {
      generateDrizzleJson: generateSQLiteDrizzleJson,
      generateMigration: async (before, after) => {
        const sqliteBefore = before as unknown as DrizzleKit.DrizzleSQLiteSnapshotJSON
        const sqliteAfter = after as unknown as DrizzleKit.DrizzleSQLiteSnapshotJSON
        const statements = await generateSQLiteMigration(sqliteBefore, sqliteAfter)

        return migrateBranchingRowIDs
          ? migrateRowIDs({ after: sqliteAfter, before: sqliteBefore, statements })
          : statements
      },
      pushSchema: async (schema, drizzle) => {
        if (!migrateBranchingRowIDs) {
          return pushSchema(schema, drizzle)
        }

        const snapshot = (await generateSQLiteDrizzleJson(schema)) as unknown as SQLiteRowIDSnapshot
        const db = drizzle as SQLiteDB

        for (const table of Object.values(snapshot.tables)) {
          const isBranchingLayout =
            table.columns.id?.type === 'integer' && table.columns._uuid?.type === 'text'
          const isLegacyLayout = table.columns.id?.type === 'text' && !table.columns._uuid

          if (!isBranchingLayout && !isLegacyLayout) {
            continue
          }

          const columns = await db.all<{ name: string; pk: number; type: string }>(
            sql`PRAGMA table_info(${sql.identifier(table.name)})`,
          )

          const existingID = columns.find((column) => column.name === 'id' && column.pk)
          const hasUUID = columns.some((column) => column.name === '_uuid')
          const needsConversion =
            (isBranchingLayout && existingID?.type.toLowerCase() === 'text' && !hasUUID) ||
            (isLegacyLayout && existingID?.type.toLowerCase() === 'integer' && hasUUID)

          if (needsConversion) {
            throw new Error(
              `SQLite table "${table.name}" requires an array/block ID migration when changing branching storage. ` +
                'Back up the database, set the SQLite adapter to push: false, generate a migration from the previous schema snapshot with payload migrate:create, and run payload migrate. ' +
                'See https://payloadcms.com/docs/branching/overview#database-indexes-and-migrations. Do not reset a database containing content you need to keep.',
            )
          }
        }

        return pushSchema(schema, drizzle)
      },
    }
  }
