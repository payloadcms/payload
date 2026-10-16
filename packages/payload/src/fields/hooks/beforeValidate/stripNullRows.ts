import type { JsonObject, PayloadRequest } from '../../../types/index.js'

/**
 * Strips invalid rows (null, undefined, primitives, arrays) from an array or blocks field
 * value in place and warns if any were found. Rows must be plain objects; anything else
 * can crash downstream code that assigns properties to them (e.g. `row.blockType = ...`).
 *
 * Returns the cleaned array typed as JsonObject[].
 */
export function stripNullRows(
  rows: unknown[],
  fieldType: string,
  fieldName: string,
  logger: PayloadRequest['payload']['logger'],
  siblingData: JsonObject,
): JsonObject[] {
  const filteredRows = rows.filter(
    (row): row is JsonObject => row != null && typeof row === 'object' && !Array.isArray(row),
  )
  if (filteredRows.length !== rows.length) {
    logger.warn({
      msg: `Stripped ${rows.length - filteredRows.length} invalid row(s) from ${fieldType} field "${fieldName}". Rows must be plain objects.`,
    })
    siblingData[fieldName] = filteredRows
  }
  return siblingData[fieldName] as JsonObject[]
}
