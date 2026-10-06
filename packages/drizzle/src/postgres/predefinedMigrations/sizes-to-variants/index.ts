import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'

import type {
  SizesToVariantsDirection,
  SizesToVariantsIndexRename,
} from '../../../utilities/getSizesToVariantsRenames.js'
import type { BasePostgresAdapter } from '../../types.js'

import {
  assertNoSizesToVariantsColumnCollisions,
  buildGeneratedLegacyIndexName,
  getSizesToVariantsRenames,
  isGeneratedLegacyIndexName,
} from '../../../utilities/getSizesToVariantsRenames.js'

type ExistingPostgresIndex = {
  columns: string[]
  isPartial: boolean
  name: string
  unique: boolean
}

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
  const plannedTables: Array<
    (typeof plan)[number] & {
      existingColumns: Set<string>
    }
  > = []

  for (const tablePlan of plan) {
    const existingColumns = await getColumnNames({
      db,
      schemaName,
      tableName: tablePlan.tableName,
    })

    assertNoSizesToVariantsColumnCollisions({
      columns: tablePlan.columns,
      existingColumns,
      tableName: tablePlan.tableName,
    })

    plannedTables.push({ ...tablePlan, existingColumns })
  }

  const reservedRelationNames =
    direction === 'down' ? await getPostgresSchemaRelationNames({ db, schemaName }) : undefined

  for (const { columns, existingColumns, indexes, tableName } of plannedTables) {
    let renamedCount = 0

    for (const { from, to } of columns) {
      if (!existingColumns.has(from) || existingColumns.has(to)) {
        continue
      }

      await db.execute(sql`
        ALTER TABLE ${sql.identifier(schemaName)}.${sql.identifier(tableName)}
        RENAME COLUMN ${sql.identifier(from)} TO ${sql.identifier(to)}
      `)
      renamedCount++
    }

    const existingIndexes = await getIndexes({ db, schemaName, tableName })

    for (const plannedIndex of indexes) {
      const index =
        reservedRelationNames && plannedIndex.legacyNameBase
          ? {
              ...plannedIndex,
              to: reservePostgresLegacyIndexName({
                existingIndexes,
                index: plannedIndex,
                reservedRelationNames,
              }),
            }
          : plannedIndex
      const existingName = resolvePostgresIndexRename({
        existingIndexes,
        index,
        tableName,
      })

      if (!existingName) {
        continue
      }

      await db.execute(sql`
        ALTER INDEX ${sql.identifier(schemaName)}.${sql.identifier(existingName)}
        RENAME TO ${sql.identifier(index.to)}
      `)
    }

    payload.logger.info({
      msg: `sizes-to-variants (${direction}): renamed ${renamedCount} column(s) on "${tableName}"`,
    })
  }
}

export function reservePostgresLegacyIndexName({
  existingIndexes,
  index,
  reservedRelationNames,
}: {
  existingIndexes: ExistingPostgresIndex[]
  index: SizesToVariantsIndexRename
  reservedRelationNames: Set<string>
}): string {
  const { legacyNameBase } = index

  if (!legacyNameBase) {
    reservedRelationNames.add(index.to)
    return index.to
  }

  const existingDestination = existingIndexes.find(
    (existingIndex) =>
      isCompatiblePostgresIndex({ existingIndex, index }) &&
      isGeneratedLegacyIndexName({
        indexName: existingIndex.name,
        legacyNameBase,
      }),
  )

  if (existingDestination) {
    reservedRelationNames.add(existingDestination.name)
    return existingDestination.name
  }

  let number = 0
  let indexName = buildGeneratedLegacyIndexName(legacyNameBase)

  while (reservedRelationNames.has(indexName)) {
    number++
    indexName = buildGeneratedLegacyIndexName(legacyNameBase, number)
  }

  reservedRelationNames.add(indexName)
  return indexName
}

export function resolvePostgresIndexRename({
  existingIndexes,
  index,
  tableName,
}: {
  existingIndexes: ExistingPostgresIndex[]
  index: SizesToVariantsIndexRename
  tableName: string
}): string | undefined {
  const destinationIndex = existingIndexes.find(({ name }) => name === index.to)

  if (destinationIndex) {
    if (!isCompatiblePostgresIndex({ existingIndex: destinationIndex, index })) {
      throw new Error(
        `Cannot run the sizes-to-variants migration because index "${index.to}" on table "${tableName}" does not match the expected columns, uniqueness, or predicate.`,
      )
    }

    return undefined
  }

  let sourceIndex: ExistingPostgresIndex | undefined
  const { legacyNameBase } = index

  if (index.from) {
    sourceIndex = existingIndexes.find(({ name }) => name === index.from)
  } else if (legacyNameBase) {
    const legacyCandidates = existingIndexes.filter((existingIndex) =>
      isGeneratedLegacyIndexName({
        indexName: existingIndex.name,
        legacyNameBase,
      }),
    )

    sourceIndex =
      legacyCandidates.find((existingIndex) =>
        isCompatiblePostgresIndex({ existingIndex, index }),
      ) ?? legacyCandidates[0]
  }

  if (!sourceIndex) {
    return undefined
  }

  if (!isCompatiblePostgresIndex({ existingIndex: sourceIndex, index })) {
    throw new Error(
      `Cannot run the sizes-to-variants migration because index "${sourceIndex.name}" on table "${tableName}" does not match the expected columns, uniqueness, or predicate.`,
    )
  }

  return sourceIndex.name === index.to ? undefined : sourceIndex.name
}

function isCompatiblePostgresIndex({
  existingIndex,
  index,
}: {
  existingIndex: ExistingPostgresIndex
  index: SizesToVariantsIndexRename
}): boolean {
  return (
    existingIndex.columns.join(',') === index.columns.join(',') &&
    existingIndex.unique === index.unique &&
    !existingIndex.isPartial
  )
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
}): Promise<ExistingPostgresIndex[]> {
  const result = await db.execute(sql`
    SELECT
      i.relname AS name,
      array_agg(a.attname::text ORDER BY k.ord) AS columns,
      ix.indisunique AS is_unique,
      ix.indpred IS NOT NULL AS is_partial
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class i ON i.oid = ix.indexrelid
    CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE n.nspname = ${schemaName} AND t.relname = ${tableName}
    GROUP BY i.relname, ix.indisunique, (ix.indpred IS NOT NULL)
  `)

  return result.rows.map(
    (row: { columns: string[]; is_partial: boolean; is_unique: boolean; name: string }) => ({
      name: row.name,
      columns: row.columns,
      isPartial: row.is_partial,
      unique: row.is_unique,
    }),
  )
}

export async function getPostgresSchemaRelationNames({
  db,
  schemaName,
}: {
  db: any
  schemaName: string
}): Promise<Set<string>> {
  const result = await db.execute(sql`
    SELECT c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ${schemaName}
  `)

  return new Set(result.rows.map((row: { name: string }) => row.name))
}
