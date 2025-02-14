import type { Where } from '../types/index.js'

export function combineWhereConstraints(
  constraints: Array<Where>,
  as: 'and' | 'or' = 'and',
): Where {
  if (constraints.length === 0) {
    return {}
  }

  return {
    [as]: constraints.filter((constraint) => {
      if (constraint && typeof constraint === 'object' && Object.keys(constraint).length > 0) {
        return true
      }
      return false
    }),
  }
}
