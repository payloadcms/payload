import type { Where } from 'payload'

type ResolvedCollectionCondition =
  | { matches: 'all-documents' }
  | { matches: 'documents-matching-where'; where: Where }
  | { matches: 'no-documents' }

export function resolveWhereForCollection({
  collectionSlug,
  fieldNames,
  where,
}: {
  collectionSlug: string
  fieldNames: Set<string>
  where: Where
}): ResolvedCollectionCondition {
  const conditions: ResolvedCollectionCondition[] = []

  for (const [key, value] of Object.entries(where)) {
    const operator = key.toLowerCase()

    // Resolve nested groups before combining them with the surrounding conditions.
    if ((operator === 'and' || operator === 'or') && Array.isArray(value)) {
      conditions.push(
        combineConditions({
          conditions: value.map((nestedWhere) =>
            resolveWhereForCollection({ collectionSlug, fieldNames, where: nestedWhere }),
          ),
          operator,
        }),
      )
      continue
    }

    // Collection identity can be resolved without inspecting any document fields.
    if (key === 'relationTo') {
      const isMatchingCollection = matchesCollectionConstraint({
        collectionSlug,
        constraint: value,
      })

      conditions.push({
        matches: isMatchingCollection ? 'all-documents' : 'no-documents',
      })
      continue
    }

    // Preserve the fallback reader's treatment of unavailable fields as nonmatching.
    if (!fieldNames.has(key)) {
      return { matches: 'no-documents' }
    }

    conditions.push({ matches: 'documents-matching-where', where: { [key]: value } })
  }

  return combineConditions({ conditions, operator: 'and' })
}

function combineConditions({
  conditions,
  operator,
}: {
  conditions: ResolvedCollectionCondition[]
  operator: 'and' | 'or'
}): ResolvedCollectionCondition {
  if (operator === 'and') {
    // One impossible condition makes the entire AND impossible.
    if (conditions.some(({ matches }) => matches === 'no-documents')) {
      return { matches: 'no-documents' }
    }
  } else if (conditions.some(({ matches }) => matches === 'all-documents')) {
    // One satisfied condition makes the entire OR satisfied.
    return { matches: 'all-documents' }
  }

  const filters = conditions
    .filter((condition) => condition.matches === 'documents-matching-where')
    .map((condition) => condition.where)

  const [firstFilter] = filters

  // No filters means every AND condition passed, or every OR condition failed.
  if (!firstFilter) {
    return { matches: operator === 'and' ? 'all-documents' : 'no-documents' }
  }

  if (filters.length === 1) {
    return { matches: 'documents-matching-where', where: firstFilter }
  }

  return { matches: 'documents-matching-where', where: { [operator]: filters } }
}

function matchesCollectionConstraint({
  collectionSlug,
  constraint,
}: {
  collectionSlug: string
  constraint: unknown
}): boolean {
  if (!constraint || typeof constraint !== 'object') {
    return true
  }

  const constraints = constraint as Record<string, unknown>

  return !(
    ('equals' in constraints && constraints.equals !== collectionSlug) ||
    ('not_equals' in constraints && constraints.not_equals === collectionSlug) ||
    ('in' in constraints && !includesCollection({ collectionSlug, constraint: constraints.in })) ||
    ('not_in' in constraints &&
      includesCollection({ collectionSlug, constraint: constraints.not_in }))
  )
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
