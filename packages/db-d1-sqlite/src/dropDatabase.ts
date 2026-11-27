import { sql } from 'drizzle-orm'

import type { DropDatabase } from './types.js'

/**
 * Drops every table. The shared SQLite version can't be used because D1 bindings have no libSQL
 * `execute`/`executeMultiple`, and D1 ignores `PRAGMA foreign_keys = OFF`, so foreign key actions
 * still run while tables are dropped. Dropping a table cascades into the tables that reference it,
 * which fails if one of those also references a table that is already gone. To avoid that, each
 * table is dropped only after the other tables that reference it. All drops run in one batch,
 * which D1 runs as a transaction, with foreign key checks deferred until it commits.
 */
export const dropDatabase: DropDatabase = async function ({ adapter }) {
  const { drizzle } = adapter

  // D1 reserves `_cf_*` tables and refuses to drop or inspect them. GLOB, unlike LIKE, treats `_`
  // literally.
  const userTables = `type = 'table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*'`

  const tables = await drizzle.all<{ name: string }>(
    sql.raw(`SELECT name FROM sqlite_master WHERE ${userTables}`),
  )

  if (!tables.length) {
    return
  }

  const foreignKeys = await drizzle.all<{ child: string; parent: string }>(
    sql.raw(
      `SELECT t.name AS child, fk."table" AS parent FROM (SELECT name FROM sqlite_master WHERE ${userTables}) t JOIN pragma_foreign_key_list(t.name) fk`,
    ),
  )

  const referencedBy = new Map<string, Set<string>>()
  for (const { child, parent } of foreignKeys) {
    if (child !== parent) {
      referencedBy.set(parent, (referencedBy.get(parent) ?? new Set()).add(child))
    }
  }

  const remaining = new Set(tables.map(({ name }) => name))
  const dropOrder: string[] = []

  while (remaining.size) {
    const isReferenced = (table: string) =>
      [...(referencedBy.get(table) ?? [])].some((child) => remaining.has(child))

    // Tables in a foreign key cycle are never unreferenced, so fall back to any remaining table.
    const next = [...remaining].find((table) => !isReferenced(table)) ?? [...remaining][0]!

    dropOrder.push(next)
    remaining.delete(next)
  }

  await drizzle.batch([
    drizzle.run(sql.raw('PRAGMA defer_foreign_keys = ON')),
    ...dropOrder.map((table) =>
      drizzle.run(sql.raw(`DROP TABLE IF EXISTS "${table.replaceAll('"', '""')}"`)),
    ),
  ])
}
