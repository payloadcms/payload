import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, RawIndex, RawTable } from '../types.js'

import { maxGeneratedIdentifierLength } from './validateIdentifierLength.js'

export type SizesToVariantsDirection = 'down' | 'up'

export type SizesToVariantsColumnRename = {
  from: string
  to: string
}

export type SizesToVariantsIndexRename = {
  /** Columns the index covers, named as they are after the column renames. */
  columns: string[]
  /** The index name to rename from on `down`. The generated legacy name is resolved on `up`. */
  from?: string
  /** Base used to verify a generated legacy index name, including a possible numeric suffix. */
  legacyNameBase?: string
  to: string
  unique: boolean
}

export type SizesToVariantsTableRenames = {
  columns: SizesToVariantsColumnRename[]
  indexes: SizesToVariantsIndexRename[]
  tableName: string
}

export function findSizesToVariantsFieldCollision({
  columns,
  existingColumns,
}: {
  columns: SizesToVariantsColumnRename[]
  existingColumns: Set<string>
}): { from: string; to: string } | undefined {
  const firstRename = columns[0]

  if (!firstRename) {
    return undefined
  }

  const fromField = getSizesToVariantsField({ columnName: firstRename.from })
  const toField = getSizesToVariantsField({ columnName: firstRename.to })

  if (!fromField || !toField) {
    return undefined
  }

  const hasSourceField = [...existingColumns].some((column) =>
    isSizesToVariantsFieldColumn({ column, field: fromField }),
  )
  const plannedDestinationColumns = new Set(columns.map(({ to }) => to))
  const hasUnexpectedDestinationField = [...existingColumns].some(
    (column) =>
      isSizesToVariantsFieldColumn({ column, field: toField }) &&
      !plannedDestinationColumns.has(column),
  )

  return hasSourceField && hasUnexpectedDestinationField
    ? { from: fromField.fieldPath, to: toField.fieldPath }
    : undefined
}

export function assertNoSizesToVariantsColumnCollisions({
  columns,
  existingColumns,
  tableName,
}: {
  columns: SizesToVariantsColumnRename[]
  existingColumns: Set<string>
  tableName: string
}): void {
  for (const { from, to } of columns) {
    if (existingColumns.has(from) && existingColumns.has(to)) {
      throw new Error(
        `Cannot run the sizes-to-variants migration because table "${tableName}" contains both "${from}" and "${to}". Move or rename the existing destination data before running this migration.`,
      )
    }
  }

  const fieldCollision = findSizesToVariantsFieldCollision({ columns, existingColumns })

  if (fieldCollision) {
    throw new Error(
      `Cannot run the sizes-to-variants migration because table "${tableName}" contains both the "${fieldCollision.from}" and "${fieldCollision.to}" fields. Move or rename the existing destination data before running this migration.`,
    )
  }
}

const columnPrefixes = [
  { current: 'variants_', legacy: 'sizes_' },
  { current: 'version_variants_', legacy: 'version_sizes_' },
]
const generatedVariantMetadataFieldNames = [
  '_objectKey',
  'filename',
  'filesize',
  'height',
  'mimeType',
  'prefix',
  'url',
  'width',
]

/**
 * Plans the column and index renames that move every upload collection's stored image sizes
 * between the legacy `sizes` group and `variants`. Reads the current (`variants`) schema the
 * adapter built from the config, so it covers each collection's main and versions tables without
 * re-deriving Payload's column naming.
 *
 * Index names come from the schema on `up`, and on `down` are rebuilt the way `buildIndexName`
 * named them before the rename. The runner still has to locate the verified generated legacy name
 * on `up`, since it may have a numeric suffix that keeps the name unique.
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

    const upload = typeof collection.upload === 'object' ? collection.upload : undefined
    const generatedVariantColumnKeys = new Set(
      (upload?.variants ?? []).flatMap(({ name }) =>
        generatedVariantMetadataFieldNames.flatMap((metadataFieldName) => [
          `variants_${name}_${metadataFieldName}`,
          `version_variants_${name}_${metadataFieldName}`,
        ]),
      ),
    )

    if (generatedVariantColumnKeys.size === 0) {
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

      for (const [columnKey, { name }] of Object.entries(rawTable.columns)) {
        if (!generatedVariantColumnKeys.has(columnKey)) {
          continue
        }

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
        .map((index) =>
          planIndexRename({ columns, direction, index, rawColumns: rawTable.columns, tableName }),
        )
        .filter((index): index is SizesToVariantsIndexRename => Boolean(index))

      plan.push({ columns, indexes, tableName })
    }
  }

  return plan
}

function getSizesToVariantsField({
  columnName,
}: {
  columnName: string
}): { columnName: string; columnPrefix: string; fieldPath: string } | undefined {
  if (columnName === 'version_sizes' || columnName.startsWith('version_sizes_')) {
    return {
      columnName: 'version_sizes',
      columnPrefix: 'version_sizes_',
      fieldPath: 'version.sizes',
    }
  }

  if (columnName === 'version_variants' || columnName.startsWith('version_variants_')) {
    return {
      columnName: 'version_variants',
      columnPrefix: 'version_variants_',
      fieldPath: 'version.variants',
    }
  }

  if (columnName === 'sizes' || columnName.startsWith('sizes_')) {
    return { columnName: 'sizes', columnPrefix: 'sizes_', fieldPath: 'sizes' }
  }

  if (columnName === 'variants' || columnName.startsWith('variants_')) {
    return { columnName: 'variants', columnPrefix: 'variants_', fieldPath: 'variants' }
  }

  return undefined
}

function isSizesToVariantsFieldColumn({
  column,
  field,
}: {
  column: string
  field: { columnName: string; columnPrefix: string }
}): boolean {
  return column === field.columnName || column.startsWith(field.columnPrefix)
}

function planIndexRename({
  columns,
  direction,
  index,
  rawColumns,
  tableName,
}: {
  columns: SizesToVariantsColumnRename[]
  direction: SizesToVariantsDirection
  index: RawIndex
  rawColumns: RawTable['columns']
  tableName: string
}): SizesToVariantsIndexRename | undefined {
  // `on` holds the column's schema key (e.g. `variants_heroLarge_filename`), not its database name.
  const currentColumns = [index.on].flat().map((key) => rawColumns[key]?.name ?? key)
  const renamedColumns = currentColumns.map((column) =>
    columns.find((rename) => (direction === 'up' ? rename.to : rename.from) === column),
  )

  if (renamedColumns.every((rename) => !rename)) {
    return undefined
  }

  const unique = Boolean(index.unique)

  if (direction === 'up') {
    const legacyColumns = currentColumns.map((column, i) => renamedColumns[i]?.from ?? column)

    return {
      columns: currentColumns,
      legacyNameBase: getLegacyIndexNameBase({
        currentColumns,
        indexName: index.name,
        legacyColumns,
        tableName,
      }),
      to: index.name,
      unique,
    }
  }

  const legacyColumns = currentColumns.map((column, i) => renamedColumns[i]?.to ?? column)
  const legacyNameBase = getLegacyIndexNameBase({
    currentColumns,
    indexName: index.name,
    legacyColumns,
    tableName,
  })

  return {
    columns: legacyColumns,
    from: index.name,
    legacyNameBase,
    to: buildGeneratedLegacyIndexName(legacyNameBase),
    unique,
  }
}

function getLegacyIndexNameBase({
  currentColumns,
  indexName,
  legacyColumns,
  tableName,
}: {
  currentColumns: string[]
  indexName: string
  legacyColumns: string[]
  tableName: string
}): string {
  const currentColumn = currentColumns.length === 1 ? currentColumns[0] : undefined
  const legacyColumn = legacyColumns.length === 1 ? legacyColumns[0] : undefined
  const currentFieldPath = currentColumn ? getGeneratedVariantFieldPath(currentColumn) : undefined
  const legacyFieldPath = legacyColumn ? getGeneratedVariantFieldPath(legacyColumn) : undefined

  if (currentColumn && currentFieldPath && legacyColumn && legacyFieldPath) {
    const currentFieldIndexNameBase = `${tableName}_${currentFieldPath}_${currentColumn}`

    if (isGeneratedLegacyIndexName({ indexName, legacyNameBase: currentFieldIndexNameBase })) {
      return `${tableName}_${legacyFieldPath}_${legacyColumn}`
    }
  }

  return legacyColumns.join('_')
}

function getGeneratedVariantFieldPath(columnName: string): string | undefined {
  for (const metadataFieldName of generatedVariantMetadataFieldNames) {
    const metadataColumnSuffix = `_${toSnakeCase(metadataFieldName)}`

    if (columnName.endsWith(metadataColumnSuffix)) {
      return columnName.slice(0, -metadataColumnSuffix.length)
    }
  }

  return undefined
}

/** Mirrors `buildIndexName` for an index that didn't collide, without registering the name. */
export function isGeneratedLegacyIndexName({
  indexName,
  legacyNameBase,
}: {
  indexName: string
  legacyNameBase: string
}): boolean {
  const suffixMatch = indexName.match(/(?:_(\d+))?_idx$/)

  if (!suffixMatch) {
    return false
  }

  return indexName === buildGeneratedLegacyIndexName(legacyNameBase, Number(suffixMatch[1] ?? 0))
}

export function buildGeneratedLegacyIndexName(name: string, number = 0): string {
  const suffix = `${number ? `_${number}` : ''}_idx`
  const indexName = `${name}${suffix}`

  return indexName.length > maxGeneratedIdentifierLength
    ? `${name.slice(0, maxGeneratedIdentifierLength - suffix.length)}${suffix}`
    : indexName
}
