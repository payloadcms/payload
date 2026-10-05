import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'

import type { DrizzleAdapter } from '../../../types.js'
import type { SizesToVariantsDirection } from '../../../utilities/getSizesToVariantsRenames.js'

import { getSizesToVariantsRenames } from '../../../utilities/getSizesToVariantsRenames.js'

/**
 * Moves every upload collection's stored image sizes between the legacy `sizes_*` columns and
 * `variants_*` (main and versions tables), renaming each column in place so no data is copied.
 * SQLite can't rename an index, so each index on a renamed column is dropped and recreated under
 * the name the current schema expects. Skips columns that are already renamed, so it's safe to
 * re-run.
 */
export async function migrateSqliteSizesToVariants({
  db,
  direction = 'up',
  payload,
}: {
  db: any
  direction?: SizesToVariantsDirection
  payload: Payload
}): Promise<void> {
  const adapter = payload.db as unknown as DrizzleAdapter
  const plan = getSizesToVariantsRenames({ adapter, direction })

  for (const { columns, indexes, tableName } of plan) {
    const existingColumns = await getColumnNames({ db, tableName })
    let renamedCount = 0

    for (const { from, to } of columns) {
      if (!existingColumns.has(from) || existingColumns.has(to)) {
        continue
      }

      await db.run(sql.raw(`ALTER TABLE \`${tableName}\` RENAME COLUMN \`${from}\` TO \`${to}\``))
      renamedCount++
    }

    const existingIndexes = await getIndexes({ db, tableName })

    for (const index of indexes) {
      const existingName =
        index.from ??
        existingIndexes.find(({ columns }) => columns.join(',') === index.columns.join(','))?.name

      if (
        !existingName ||
        existingName === index.to ||
        !existingIndexes.some(({ name }) => name === existingName) ||
        existingIndexes.some(({ name }) => name === index.to)
      ) {
        continue
      }

      const columnList = index.columns.map((column) => `\`${column}\``).join(', ')

      await db.run(sql.raw(`DROP INDEX \`${existingName}\``))
      await db.run(
        sql.raw(
          `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX \`${index.to}\` ON \`${tableName}\` (${columnList})`,
        ),
      )
    }

    payload.logger.info({
      msg: `sizes-to-variants (${direction}): renamed ${renamedCount} column(s) on "${tableName}"`,
    })
  }
}

async function getColumnNames({
  db,
  tableName,
}: {
  db: any
  tableName: string
}): Promise<Set<string>> {
  const rows: { name: string }[] = await db.all(
    sql.raw(`SELECT name FROM pragma_table_info('${tableName}')`),
  )

  return new Set(rows.map(({ name }) => name))
}

async function getIndexes({
  db,
  tableName,
}: {
  db: any
  tableName: string
}): Promise<{ columns: string[]; name: string }[]> {
  // `origin = 'c'` keeps only `CREATE INDEX` indexes, skipping SQLite's internal autoindexes.
  const rows: { column_name: string; index_name: string; seqno: number }[] = await db.all(
    sql.raw(
      `SELECT il.name AS index_name, ii.name AS column_name, ii.seqno AS seqno
       FROM pragma_index_list('${tableName}') AS il
       JOIN pragma_index_info(il.name) AS ii
       WHERE il.origin = 'c'
       ORDER BY il.name, ii.seqno`,
    ),
  )

  const indexes = new Map<string, string[]>()

  for (const { column_name, index_name } of rows) {
    indexes.set(index_name, [...(indexes.get(index_name) ?? []), column_name])
  }

  return [...indexes].map(([name, columns]) => ({ name, columns }))
}
