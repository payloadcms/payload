import { mergeColumns } from '../utilities/getSchemaColumns.js'

type ResolveStreamedCSVColumnsArgs = {
  /**
   * Column keys from the first batch after a collection `before` hook.
   * Omit when no before hook ran.
   */
  hookColumns?: string[]
  /**
   * Column keys from the first batch before the collection `before` hook.
   * Keys present here and missing from `hookColumns` were removed by the hook.
   */
  rawColumns?: string[]
  /**
   * Column keys discovered by flattening every document in the export,
   * including documents that appear after the first batch.
   */
  scannedColumns: string[]
  /** Schema-derived columns. These set the base order. */
  schemaColumns: string[]
}

/**
 * Build the CSV header for a streamed export.
 *
 * Schema columns set the base order. `scannedColumns` adds keys that only
 * appear in later batches, such as array indices beyond those in the first
 * page. When a collection before hook rewrites the first batch, keys it
 * removes are dropped and keys it adds are kept. Columns that exist only in
 * later batches stay in the header.
 */
export function resolveStreamedCSVColumns({
  hookColumns,
  rawColumns,
  scannedColumns,
  schemaColumns,
}: ResolveStreamedCSVColumnsArgs): string[] {
  if (!hookColumns) {
    return mergeColumns(schemaColumns, scannedColumns)
  }

  const hookColumnSet = new Set(hookColumns)
  const removedByHook = (rawColumns ?? []).filter((key) => !hookColumnSet.has(key))
  const merged = mergeColumns(schemaColumns, [...scannedColumns, ...hookColumns])
  const allowed = new Set<string>([...hookColumns, ...scannedColumns])

  for (const key of removedByHook) {
    allowed.delete(key)
  }

  return merged.filter((column) => allowed.has(column))
}
