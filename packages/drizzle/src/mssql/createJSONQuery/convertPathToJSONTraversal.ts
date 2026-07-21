import { sanitizePathSegment } from '../../utilities/sanitizePathSegment.js'

/**
 * Converts Payload path segments into a SQL Server JSON path (e.g. `$.a.b[0].c`) suitable for
 * `JSON_VALUE`/`JSON_QUERY`. The first segment (the column) is dropped — the caller supplies the
 * column separately.
 */
export const convertPathToJSONTraversal = (incomingSegments: string[]): string => {
  const segments = [...incomingSegments]
  segments.shift()

  return segments.reduce((res, segment) => {
    const isNumeric = !Number.isNaN(parseInt(segment))
    if (isNumeric) {
      return `${res}[${segment}]`
    }
    return `${res}.${sanitizePathSegment(segment)}`
  }, '$')
}
