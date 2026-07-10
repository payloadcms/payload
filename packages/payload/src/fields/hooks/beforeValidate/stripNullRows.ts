import type { JsonObject, PayloadRequest } from '../../../types/index.js'

/**
 * Strips null rows from an array or blocks field value in place and warns if any were found.
 * Null slots can appear when the Admin UI form state desync leaves null indices after
 * rapidly adding, deleting, or reordering rows.
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
  const nullCount = rows.reduce((n: number, row) => (row == null ? n + 1 : n), 0)
  if (nullCount > 0) {
    logger.warn({
      msg: `Stripped ${nullCount} null row(s) from ${fieldType} field "${fieldName}".`,
    })
    siblingData[fieldName] = rows.filter((row) => row != null)
  }
  return siblingData[fieldName] as JsonObject[]
}
