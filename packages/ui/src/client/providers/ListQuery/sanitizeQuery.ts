import type { ListQuery, Where } from 'payload'

/**
 * Sanitize empty strings from the query, e.g. `?preset=`
 * This is how we determine whether to clear user preferences for certain params
 * Once cleared, they are no longer needed in the URL
 */
export const sanitizeQuery = (toSanitize: ListQuery): ListQuery => {
  const sanitized = { ...toSanitize }

  Object.entries(sanitized).forEach(([key, value]) => {
    if (
      key === 'columns' &&
      (value === '[]' || (Array.isArray(sanitized[key]) && sanitized[key].length === 0))
    ) {
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
