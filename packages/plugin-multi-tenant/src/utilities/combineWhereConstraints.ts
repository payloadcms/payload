import type { Where } from 'payload'

export function combineWhereConstraints(constraints: Array<Where>): Where {
  if (constraints.length === 0) {
    return {}
  }
  if (constraints.length === 1 && constraints[0]) {
    return constraints[0]
  }
  const andConstraint: Where = {
    and: [],
  }
  constraints.forEach((constraint) => {
    if (andConstraint.and && constraint && typeof constraint === 'object') {
      andConstraint.and.push(constraint)
    }
  })
  return andConstraint
}
