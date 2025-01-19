import type { Where, WhereField } from '../types/index.js'

/**
 * Take a where query and flatten it to all top-level operators
 */
export const flattenWhereToOperators = (query: Where): WhereField[] => {
  const flattenedConstraints: WhereField[] = []

  for (const [key, val] of Object.entries(query)) {
    if ((key === 'and' || key === 'or') && Array.isArray(val)) {
      for (const subVal of val) {
        flattenedConstraints.push(...flattenWhereToOperators(subVal))
      }
    } else {
      flattenedConstraints.push({ [key]: val })
    }
  }

  return flattenedConstraints
}
