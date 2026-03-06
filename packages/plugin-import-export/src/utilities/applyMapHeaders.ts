import type { FlattenedField, SanitizedCollectionConfig } from 'payload'

import type { MapHeadersFunction } from '../types.js'

import { buildColumnToFieldMap } from './buildColumnToFieldMap.js'

type ApplyMapHeadersArgs = {
  collectionConfig: SanitizedCollectionConfig
  columns: string[]
  mapHeaders: MapHeadersFunction
}

export type ColumnMapping = {
  mappedColumns: string[]
  originalToMapped: Map<string, string>
}

/**
 * Applies a `mapHeaders` function to a list of column names.
 *
 * Returns the mapped column names alongside a mapping from original to mapped
 * so callers can remap row keys or build `{ key, header }` pairs for csv-stringify.
 */
export const applyMapHeaders = ({
  collectionConfig,
  columns,
  mapHeaders,
}: ApplyMapHeadersArgs): ColumnMapping => {
  const fieldMap = buildColumnToFieldMap(collectionConfig.flattenedFields)

  const mappedColumns: string[] = []
  const originalToMapped = new Map<string, string>()

  for (const col of columns) {
    const mapped = mapHeaders({ columnName: col, field: fieldMap.get(col) })
    mappedColumns.push(mapped)
    originalToMapped.set(col, mapped)
  }

  return { mappedColumns, originalToMapped }
}
