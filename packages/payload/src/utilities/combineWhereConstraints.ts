import type { Where } from '../types/index.js'

export function combineWhereConstraints(
  constraints: Array<undefined | Where>,
  as: 'and' | 'or' = 'and',
): Where {
  if (constraints.length === 0) {
    return {}
  }

  return {
    [as]: constraints.filter((constraint): constraint is Where => {
      if (constraint && typeof constraint === 'object' && Object.keys(constraint).length > 0) {
        return true
      }
      return false
    }),
  }
}
