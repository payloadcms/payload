export const validOperators = [
  'equals',
  'contains',
  'not_equals',
  'in',
  'all',
  'not_in',
  'exists',
  'greater_than',
  'greater_than_equal',
  'less_than',
  'less_than_equal',
  'like',
  'not_like',
  'within',
  'intersects',
  'near',
] as const

export type Operator = (typeof validOperators)[number]

export const validOperatorSet = new Set<Operator>(validOperators)

/**
 * Matches a dot-separated path where each segment is a word character (a-zA-Z0-9_).
 * Used to validate field paths before they are processed by query builders.
 */
export const SAFE_FIELD_PATH_REGEX = /^\w+(?:\.\w+)*$/
