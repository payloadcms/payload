import type { ListQuery, Where } from 'payload'

/** `JSON.parse` a string value once; returns `undefined` on failure. Non-strings pass through. */
const parseJSON = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/**
 * Sanitize empty strings from the query, e.g. `?preset=`
 * This is how we determine whether to clear user preferences for certain params
 * Once cleared, they are no longer needed in the URL
 */
export const sanitizeQuery = (toSanitize: ListQuery): ListQuery => {
  const sanitized = { ...toSanitize }

  // `columns` and `queryByGroup` are written to the URL as JSON strings (see
  // ListQueryProvider's `JSON.stringify(...)`). Parse each once on read, then validate
  // the shape (`string[]` / plain object) and drop anything else so defaults apply.
  // Without parsing, each refresh re-stringified the value and added another escape
  // layer until the URL overflowed the request size limit (414 URI Too Long). Values
  // from URLs already corrupted by that bug are still strings after one parse, so
  // they are dropped rather than recursively unwrapped.
  // See https://github.com/payloadcms/payload/issues/16659
  if (sanitized.columns !== undefined) {
    const columns = parseJSON(sanitized.columns)

    if (Array.isArray(columns) && columns.every((c) => typeof c === 'string')) {
      sanitized.columns = columns
    } else {
      delete sanitized.columns
    }
  }

  if (sanitized.queryByGroup !== undefined) {
    const queryByGroup = parseJSON(sanitized.queryByGroup)

    if (queryByGroup !== null && typeof queryByGroup === 'object' && !Array.isArray(queryByGroup)) {
      sanitized.queryByGroup = queryByGroup as ListQuery['queryByGroup']
    } else {
      delete sanitized.queryByGroup
    }
  }

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
