import type { Where } from '../types/index.js'

import { QueryError } from '../errors/QueryError.js'

export function scopePolymorphicJoinWhere({
  canMatchField,
  collectionSlug,
  where,
}: {
  canMatchField?: (args: { constraint: Where[string]; path: string }) => boolean
  collectionSlug: string
  where: Where
}): boolean | Where {
  const conditions: Where[] = []
  let canMatch = true

  for (const [path, constraint] of Object.entries(where)) {
    if (path === 'relationTo') {
      canMatch = matchesCollectionConstraint({ collectionSlug, constraint }) && canMatch
      continue
    }

    const operator = path.toLowerCase()
    if ((operator === 'and' || operator === 'or') && Array.isArray(constraint)) {
      const scoped = constraint.map((where) =>
        scopePolymorphicJoinWhere({ canMatchField, collectionSlug, where }),
      )
      const filters = scoped.filter((where): where is Where => typeof where !== 'boolean')

      if (operator === 'and') {
        canMatch = !scoped.includes(false) && canMatch
        conditions.push(...filters)
      } else if (!scoped.includes(true)) {
        canMatch = filters.length > 0 && canMatch
        if (filters.length) {
          conditions.push({ or: filters })
        }
      }
      continue
    }

    canMatch = (canMatchField?.({ constraint, path }) ?? true) && canMatch
    conditions.push({ [path]: constraint })
  }

  if (!canMatch) {
    return false
  }

  if (!conditions.length) {
    return true
  }

  return conditions.length === 1 ? conditions[0]! : { and: conditions }
}

export function matchesCollectionConstraint({
  collectionSlug,
  constraint,
}: {
  collectionSlug: string
  constraint: unknown
}): boolean {
  if (!constraint || typeof constraint !== 'object' || Array.isArray(constraint)) {
    throw new QueryError([{ path: 'relationTo' }])
  }

  const matches = Object.entries(constraint).map(([operator, value]) => {
    switch (operator) {
      case 'equals':
        return value === collectionSlug
      case 'in':
        return includesCollection({ collectionSlug, constraint: value })
      case 'not_equals':
        return value !== collectionSlug
      case 'not_in':
        return !includesCollection({ collectionSlug, constraint: value })
      default:
        throw new QueryError([{ path: `relationTo.${operator}` }])
    }
  })

  return matches.every(Boolean)
}

function includesCollection({
  collectionSlug,
  constraint,
}: {
  collectionSlug: string
  constraint: unknown
}): boolean {
  if (typeof constraint === 'string') {
    return constraint.split(',').includes(collectionSlug)
  }

  return Array.isArray(constraint) && constraint.includes(collectionSlug)
}
