import type { Where } from '../types/index.js'

export function combineWhereConstraints(
  constraints: Array<undefined | Where>,
  as: 'and' | 'or' = 'and',
): Where {
  if (constraints.length === 0) {
    return {}
  }

  const reducedConstraints = constraints.reduce<Partial<Where>>(
    (acc: Partial<Where>, constraint) => {
      if (constraint && typeof constraint === 'object' && Object.keys(constraint).length > 0) {
        if (as in constraint) {
          // merge the objects under the shared key
          acc[as] = [...(acc[as] as Where[]), ...(constraint[as] as Where[])]
        } else {
          // the constraint does not share the key
          acc[as]?.push(constraint)
        }
      }

      return acc
    },
    { [as]: [] } satisfies Where,
  )

  if (reducedConstraints[as]?.length === 0) {
    // If there are no constraints, return an empty object
    return {}
  }

  return reducedConstraints as Where
}
