import type { Where } from '@ruya.sa/payload'

export const sanitizeFilterOptionsQuery = (query: Where): Where => {
  for (const key in query) {
    const value = query[key]
    if ((key.toLowerCase() === 'and' || key.toLowerCase() === 'or') && Array.isArray(value)) {
      for (const val of value) {
        sanitizeFilterOptionsQuery(val)
      }
    } else if (
      value &&
      typeof value === 'object' &&
      'in' in value &&
      Array.isArray(value.in) &&
      value.in.length === 0
    ) {
      {
        query[key] = { exists: false }
      }
    }
  }

  return query
}
