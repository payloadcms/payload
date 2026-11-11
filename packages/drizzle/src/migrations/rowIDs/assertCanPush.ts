import { sql } from 'drizzle-orm'

import type { DrizzleAdapter, PostgresDB, SQLiteDB } from '../../types.js'

/** A schema diff cannot infer the ownership-preserving v4 data conversion. */
export async function assertRowIDsCanBePushed({
  adapter,
}: {
  adapter: DrizzleAdapter
}): Promise<void> {
  for (const table of Object.values(adapter.rawTables)) {
    if (
      !table.columns._uuid ||
      !table.columns._order ||
      !table.columns._parentID ||
      !table.columns.id?.primaryKey
    ) {
      continue
    }

    let columns: { name: string }[]

    if (adapter.name === 'postgres') {
      const result = await (adapter.drizzle as PostgresDB).execute(sql`
        SELECT column_name AS name FROM information_schema.columns
        WHERE table_schema = ${adapter.schemaName || 'public'} AND table_name = ${table.name}
      `)

      columns = result.rows as { name: string }[]
    } else {
      columns = await (adapter.drizzle as SQLiteDB).all<{ name: string }>(
        sql`PRAGMA table_info(${sql.identifier(table.name)})`,
      )
    }

    if (
      columns.some(({ name }) => name === 'id') &&
      !columns.some(({ name }) => name === '_uuid')
    ) {
      throw new Error(
        `Table "${table.name}" needs the v4 SQL array/block row ID migration. ` +
          'Back up the database, set push: false, generate a migration from the previous schema snapshot with payload migrate:create, and run payload migrate. ' +
          'See https://payloadcms.com/docs/migration-guide/v4. A fresh database already uses the new layout.',
      )
    }
  }
}
