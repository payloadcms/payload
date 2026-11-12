import { sql } from 'drizzle-orm'

import type { DrizzleAdapter, PostgresDB, SQLiteDB } from '../../types.js'

/** A schema push cannot infer the ownership-preserving branch-enablement conversion. */
export async function assertBranchingSchemaCanBePushed({
  adapter,
}: {
  adapter: DrizzleAdapter
}): Promise<void> {
  if (!adapter.payload.config.branching?.enabled) {
    return
  }
  for (const table of Object.values(adapter.rawTables)) {
    const hasBranchIdentity = Boolean(table.columns._branch)
    const hasSeparateRowIDs = Boolean(
      table.columns._uuid && table.columns._order && table.columns._parentID,
    )

    if (!table.columns.id?.primaryKey || (!hasBranchIdentity && !hasSeparateRowIDs)) {
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
      ((hasBranchIdentity && !columns.some(({ name }) => name === '_branch')) ||
        (hasSeparateRowIDs && !columns.some(({ name }) => name === '_uuid')))
    ) {
      throw new Error(
        `Table "${table.name}" needs the SQL branch-enablement migration before branching schema changes can be pushed. ` +
          `Back up the database, set push: false, run payload migrate:create enable-branching --file ${adapter.packageName}/branching using the previous schema snapshot, then payload migrate. ` +
          'See https://payloadcms.com/docs/branching/overview#database-indexes-and-migrations. A fresh database already uses the new layout.',
      )
    }
  }
}
