import type { Where } from '../types/index.js'

const readConstraintKey = Symbol.for('payload.nestedRelationshipReadConstraint')

/**
 * Scopes a nested has-many relationship query to the related documents the caller can read.
 *
 * The returned query matches related documents that satisfy both the caller's query and the
 * related collection's read constraint. The read constraint is also attached on its own, so a
 * database adapter can evaluate `equals` against readable related documents only. Without it,
 * any related document the caller cannot read would make `equals` fail.
 *
 * The constraint is stored under a symbol, which a REST or GraphQL query cannot supply.
 */
export function constrainNestedRelationshipQuery({
  readConstraint,
  where,
}: {
  readConstraint: Where
  where: Where
}): Where {
  const constrainedWhere: Where = { and: [where, readConstraint] }

  Object.defineProperty(constrainedWhere, readConstraintKey, {
    enumerable: false,
    value: readConstraint,
  })

  return constrainedWhere
}

/**
 * Returns the read constraint attached by `constrainNestedRelationshipQuery`, if any.
 */
export function getNestedRelationshipReadConstraint(where: unknown): undefined | Where {
  if (typeof where !== 'object' || where === null) {
    return undefined
  }

  return (where as { [readConstraintKey]?: Where })[readConstraintKey]
}
