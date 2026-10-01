import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, RawIndex } from '../types.js'

import { maxGeneratedIdentifierLength } from './validateIdentifierLength.js'

export type SizesToVariantsDirection = 'down' | 'up'

export type SizesToVariantsColumnRename = {
  from: string
  to: string
}

export type SizesToVariantsIndexRename = {
  /** Columns the index covers, named as they are after the column renames. */
  columns: string[]
  /** The index name to rename from on `up` (unknown up front — looked up by column at runtime). */
  from?: string
  to: string
  unique: boolean
}

export type SizesToVariantsTableRenames = {
  columns: SizesToVariantsColumnRename[]
  indexes: SizesToVariantsIndexRename[]
  tableName: string
}

const columnPrefixes = [
  { current: 'variants_', legacy: 'sizes_' },
  { current: 'version_variants_', legacy: 'version_sizes_' },
]

/**
 * Plans the column and index renames that move every upload collection's stored image sizes
 * between the legacy `sizes` group and `variants`. Reads the current (`variants`) schema the
 * adapter built from the config, so it covers each collection's main and versions tables without
 * re-deriving Payload's column naming.
 *
 * Index names come from the schema on `up`, and on `down` are rebuilt the way `buildIndexName`
 * named them before the rename. The runner still has to locate the existing index by column on
 * `up`, since a legacy name may have been de-duplicated with a numeric suffix.
 */
export function getSizesToVariantsRenames({
  adapter,
  direction,
}: {
  adapter: DrizzleAdapter
  direction: SizesToVariantsDirection
}): SizesToVariantsTableRenames[] {
  const plan: SizesToVariantsTableRenames[] = []

  for (const collection of adapter.payload.config.collections) {
    if (!collection.upload) {
      continue
    }

    const tableNames = [adapter.tableNameMap.get(toSnakeCase(collection.slug))]

    if (collection.versions) {
      tableNames.push(
        adapter.tableNameMap.get(`_${toSnakeCase(collection.slug)}${adapter.versionsSuffix}`),
      )
    }

    for (const tableName of tableNames) {
      const rawTable = tableName ? adapter.rawTables[tableName] : undefined

      if (!tableName || !rawTable) {
        continue
      }

      const columns: SizesToVariantsColumnRename[] = []

      for (const { name } of Object.values(rawTable.columns)) {
        const prefix = columnPrefixes.find(({ current }) => name.startsWith(current))

        if (!prefix) {
          continue
        }

        const legacyName = `${prefix.legacy}${name.slice(prefix.current.length)}`

        columns.push(
          direction === 'up' ? { from: legacyName, to: name } : { from: name, to: legacyName },
        )
      }

      if (columns.length === 0) {
        continue
      }

      const indexes = Object.values(rawTable.indexes ?? {})
        .map((index) => planIndexRename({ columns, direction, index, tableName }))
        .filter((index): index is SizesToVariantsIndexRename => Boolean(index))

      plan.push({ columns, indexes, tableName })
    }
  }

  return plan
}

function planIndexRename({
  columns,
  direction,
  index,
  tableName,
}: {
  columns: SizesToVariantsColumnRename[]
  direction: SizesToVariantsDirection
  index: RawIndex
  tableName: string
}): SizesToVariantsIndexRename | undefined {
  const currentColumns = [index.on].flat()
  const renamedColumns = currentColumns.map((column) =>
    columns.find((rename) => (direction === 'up' ? rename.to : rename.from) === column),
  )

  if (renamedColumns.every((rename) => !rename)) {
    return undefined
  }

  const unique = Boolean(index.unique)

  if (direction === 'up') {
    return { columns: currentColumns, to: index.name, unique }
  }

  const legacyColumns = currentColumns.map((column, i) => renamedColumns[i]?.to ?? column)

  return {
    columns: legacyColumns,
    from: index.name,
    to: buildLegacyIndexName(`${tableName}_${legacyColumns.join('_')}`),
    unique,
  }
}

/** Mirrors `buildIndexName` for an index that didn't collide, without registering the name. */
function buildLegacyIndexName(name: string): string {
  const suffix = '_idx'
  const indexName = `${name}${suffix}`

  return indexName.length > maxGeneratedIdentifierLength
    ? `${name.slice(0, maxGeneratedIdentifierLength - suffix.length)}${suffix}`
    : indexName
}
