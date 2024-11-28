import type { Where } from 'payload'

export const getHasNearConstraint = (where?: Where): boolean => {
  if (!where) {
    return false
  }

  for (const key in where) {
    if (key === 'near') {
      return true
    }

    if (['AND', 'OR'].includes(key.toUpperCase())) {
      const value = where[key]
      if (Array.isArray(value)) {
        for (const where of value) {
          if (getHasNearConstraint(where)) {
            return true
          }
        }
      }
    }
  }

  return false
}
