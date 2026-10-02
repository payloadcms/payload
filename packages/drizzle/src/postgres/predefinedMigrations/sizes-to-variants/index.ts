import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'

import type { SizesToVariantsDirection } from '../../../utilities/getSizesToVariantsRenames.js'
import type { BasePostgresAdapter } from '../../types.js'

import { getSizesToVariantsRenames } from '../../../utilities/getSizesToVariantsRenames.js'

/**
 * Moves every upload collection's stored image sizes between the legacy `sizes_*` columns and
 * `variants_*` (main and versions tables), renaming each column in place so no data is copied,
 * then renames the indexes on those columns to what the current schema expects. Skips columns
 * that are already renamed, so it's safe to re-run.
 */
export async function migratePostgresSizesToVariants({
  db,
  direction = 'up',
  payload,
}: {
  db: any
  direction?: SizesToVariantsDirection
  payload: Payload
}): Promise<void> {
  const adapter = payload.db as unknown as BasePostgresAdapter
  const schemaName = adapter.schemaName || 'public'
  const plan = getSizesToVariantsRenames({ adapter, direction })

  for (const { columns, indexes, tableName } of plan) {
    const existingColumns = await getColumnNames({ db, schemaName, tableName })
    let renamedCount = 0

    for (const { from, to } of columns) {
      if (!existingColumns.has(from) || existingColumns.has(to)) {
        continue
      }

      await db.execute(
        sql.raw(`ALTER TABLE "${schemaName}"."${tableName}" RENAME COLUMN "${from}" TO "${to}"`),
      )
      renamedCount++
    }

    const existingIndexes = await getIndexes({ db, schemaName, tableName })

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

      await db.execute(
        sql.raw(`ALTER INDEX "${schemaName}"."${existingName}" RENAME TO "${index.to}"`),
      )
    }

    payload.logger.info({
      msg: `sizes-to-variants (${direction}): renamed ${renamedCount} column(s) on "${tableName}"`,
    })
  }
}

async function getColumnNames({
  db,
  schemaName,
  tableName,
}: {
  db: any
  schemaName: string
  tableName: string
}): Promise<Set<string>> {
  const result = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = ${schemaName} AND table_name = ${tableName}
  `)

  return new Set(result.rows.map((row: { column_name: string }) => row.column_name))
}

async function getIndexes({
  db,
  schemaName,
  tableName,
}: {
  db: any
  schemaName: string
  tableName: string
}): Promise<{ columns: string[]; name: string }[]> {
  const result = await db.execute(sql`
    SELECT i.relname AS name, array_agg(a.attname::text ORDER BY k.ord) AS columns
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class i ON i.oid = ix.indexrelid
    CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE n.nspname = ${schemaName} AND t.relname = ${tableName}
    GROUP BY i.relname
  `)

  return result.rows.map((row: { columns: string[]; name: string }) => ({
    name: row.name,
    columns: row.columns,
  }))
}
