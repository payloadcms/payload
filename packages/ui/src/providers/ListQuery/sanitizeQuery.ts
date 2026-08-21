import type { ListQuery, Where } from 'payload'

/**
 * Repeatedly `JSON.parse` a value while it remains a string, unwrapping any number
 * of accumulated `JSON.stringify` layers back to its canonical form. A malformed
 * value (parse failure) is returned as-is. Each parse strictly removes one layer, so
 * this always terminates.
 */
const parseJSONLayers = (value: unknown): unknown => {
  while (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return value
    }
  }

  return value
}

/**
 * Sanitize empty strings from the query, e.g. `?preset=`
 * This is how we determine whether to clear user preferences for certain params
 * Once cleared, they are no longer needed in the URL
 */
export const sanitizeQuery = (toSanitize: ListQuery): ListQuery => {
  const sanitized = { ...toSanitize }

  // `columns` and `queryByGroup` are written to the URL as JSON strings (see
  // ListQueryProvider's `JSON.stringify(...)`). Parse them back into their canonical
  // array/object form on read so the next write does not re-stringify an
  // already-stringified value. Without this, each refresh added another escape layer
  // until the URL overflowed the request size limit (414 URI Too Long). Unwrapping
  // every accumulated layer also heals URLs already corrupted by the prior behavior.
  // See https://github.com/payloadcms/payload/issues/16659
  sanitized.columns = parseJSONLayers(sanitized.columns) as ListQuery['columns']
  sanitized.queryByGroup = parseJSONLayers(sanitized.queryByGroup) as ListQuery['queryByGroup']

  Object.entries(sanitized).forEach(([key, value]) => {
    if (key === 'columns' && Array.isArray(sanitized[key]) && sanitized[key].length === 0) {
      delete sanitized[key]
    }

    if (
      key === 'where' &&
      typeof value === 'object' &&
      value !== null &&
      !Object.keys(value as Where).length
    ) {
      delete sanitized[key]
    }

    if ((key === 'limit' || key === 'page') && typeof value === 'string') {
      const parsed = parseInt(value, 10)
      sanitized[key] = Number.isNaN(parsed) ? undefined : parsed
    }

    if (key === 'page' && value === 0) {
      delete sanitized[key]
    }

    if (value === '') {
      delete sanitized[key]
    }
  })

  return sanitized
}
