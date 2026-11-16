import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'

import type { DrizzleAdapter } from '../../../types.js'
import type { SizesToVariantsDirection } from '../../../utilities/getSizesToVariantsRenames.js'

import {
  assertNoSizesToVariantsColumnCollisions,
  getSizesToVariantsRenames,
  isGeneratedLegacyIndexName,
} from '../../../utilities/getSizesToVariantsRenames.js'

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
  const plannedTables: Array<
    (typeof plan)[number] & {
      existingColumns: Set<string>
    }
  > = []

  for (const tablePlan of plan) {
    const existingColumns = await getColumnNames({ db, tableName: tablePlan.tableName })

    assertNoSizesToVariantsColumnCollisions({
      columns: tablePlan.columns,
      existingColumns,
      tableName: tablePlan.tableName,
    })

    plannedTables.push({ ...tablePlan, existingColumns })
  }

  for (const { columns, existingColumns, indexes, tableName } of plannedTables) {
    const columnsAfterRename = new Set(existingColumns)
    let renamedCount = 0

    for (const { from, to } of columns) {
      if (!existingColumns.has(from) || existingColumns.has(to)) {
        continue
      }

      columnsAfterRename.delete(from)
      columnsAfterRename.add(to)

      await db.run(sql`
        ALTER TABLE ${sql.identifier(tableName)}
        RENAME COLUMN ${sql.identifier(from)} TO ${sql.identifier(to)}
      `)
      renamedCount++
    }

    const existingIndexes = await getIndexes({ db, tableName })

    for (const index of indexes) {
      if (!index.columns.every((column) => columnsAfterRename.has(column))) {
        continue
      }

      const destinationIndex = existingIndexes.find(({ name }) => name === index.to)
      const sourceIndex = destinationIndex
        ? undefined
        : index.from
          ? existingIndexes.find(({ name }) => name === index.from)
          : index.legacyNameBase
            ? existingIndexes.find(
                ({ name, columns }) =>
                  columns.join(',') === index.columns.join(',') &&
                  isGeneratedLegacyIndexName({
                    indexName: name,
                    legacyNameBase: index.legacyNameBase,
                  }),
              )
            : undefined

      if (destinationIndex) {
        if (
          destinationIndex.columns.join(',') !== index.columns.join(',') ||
          destinationIndex.unique !== index.unique
        ) {
          throw new Error(
            `Cannot run the sizes-to-variants migration because index "${index.to}" on table "${tableName}" does not match the expected columns or uniqueness.`,
          )
        }
      } else {
        const unique = index.unique ? sql.raw('UNIQUE ') : sql.empty()
        const columnList = sql.join(
          index.columns.map((column) => sql.identifier(column)),
          sql.raw(', '),
        )

        await db.run(sql`
          CREATE ${unique}INDEX ${sql.identifier(index.to)}
          ON ${sql.identifier(tableName)} (${columnList})
        `)
      }

      if (sourceIndex && sourceIndex.name !== index.to) {
        await db.run(sql`DROP INDEX ${sql.identifier(sourceIndex.name)}`)
      }
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
    sql`SELECT name FROM pragma_table_info(${tableName})`,
  )

  return new Set(rows.map(({ name }) => name))
}

async function getIndexes({
  db,
  tableName,
}: {
  db: any
  tableName: string
}): Promise<{ columns: string[]; name: string; unique: boolean }[]> {
  // `origin = 'c'` keeps only `CREATE INDEX` indexes, skipping SQLite's internal autoindexes.
  const rows: { column_name: string; index_name: string; is_unique: number; seqno: number }[] =
    await db.all(sql`
      SELECT
        il.name AS index_name,
        il."unique" AS is_unique,
        ii.name AS column_name,
        ii.seqno AS seqno
      FROM pragma_index_list(${tableName}) AS il
      JOIN pragma_index_info(il.name) AS ii
      WHERE il.origin = 'c'
      ORDER BY il.name, ii.seqno
    `)

  const indexes = new Map<string, { columns: string[]; unique: boolean }>()

  for (const { column_name, index_name, is_unique } of rows) {
    const index = indexes.get(index_name) ?? { columns: [], unique: Boolean(is_unique) }

    index.columns.push(column_name)
    indexes.set(index_name, index)
  }

  return [...indexes].map(([name, index]) => ({ name, ...index }))
}
