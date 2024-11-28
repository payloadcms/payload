import type { Where } from 'payload'

export const getHasNearConstraint = (where?: Where): boolean => {
  if (!where) {
    return false
  }

  for (const key in where) {
    const value = where[key]

    if (Array.isArray(value) && ['AND', 'OR'].includes(key.toUpperCase())) {
      for (const where of value) {
        if (getHasNearConstraint(where)) {
          return true
        }
      }
    }

    for (const key in value) {
      if (key === 'near') {
        return true
      }
    }
  }

  return false
}
