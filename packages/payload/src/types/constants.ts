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
  'within',
  'intersects',
  'near',
] as const

export const validOperatorMap = validOperators.reduce((acc, operator) => {
  acc[operator] = true
  return acc
}, {})
