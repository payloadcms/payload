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
