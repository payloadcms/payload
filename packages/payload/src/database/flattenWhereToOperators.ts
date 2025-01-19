import type { Where, WhereField } from '../types/index.js'

/**
 * Take a where query and flatten it to all top-level operators
 */
export function flattenWhereToOperators(query: Where): WhereField[] {
  const result: WhereField[] = []

  for (const [key, value] of Object.entries(query)) {
    if ((key === 'and' || key === 'or') && Array.isArray(value)) {
      for (const subQuery of value) {
        // We just collect flattened results from each nested sub-query
        const flattenedSub = flattenWhereToOperators(subQuery)
        result.push(...flattenedSub)
      }
    } else {
      // `value` is a WhereField
      result.push(value as WhereField)
    }
  }

  return result
}
