import type { CollectionListQueryPreferences, CollectionPreferences, ListQuery } from 'payload'

const scopedKeys = [
  'groupBy',
  'limit',
  'page',
  'preset',
  'queryByGroup',
  'search',
  'sort',
  'treeExpanded',
  'where',
] as const satisfies readonly (keyof CollectionListQueryPreferences)[]

/** Capture only layout-owned query state; shared columns remain outside this snapshot. */
export function getListLayoutQuery({
  query,
}: {
  query: ListQuery
}): CollectionListQueryPreferences {
  const snapshot: CollectionListQueryPreferences = {}
  const groupBy = getNonEmptyString({ value: query.groupBy })
  const limit = getPositiveInteger({ value: query.limit })
  const page = getPositiveInteger({ value: query.page })
  const search = getNonEmptyString({ value: query.search })
  const sort = getSort({ value: query.sort })
  const where = getSerializableObject({ value: query.where })

  if (groupBy !== undefined) {
    snapshot.groupBy = groupBy
  }
  if (limit !== undefined) {
    snapshot.limit = limit
  }
  if (page !== undefined) {
    snapshot.page = page
  }
  if (search !== undefined) {
    snapshot.search = search
  }
  if (sort !== undefined) {
    snapshot.sort = sort
  }
  if (where !== undefined) {
    snapshot.where = where
  }

  if (
    (typeof query.preset === 'number' && Number.isFinite(query.preset)) ||
    getNonEmptyString({ value: query.preset }) !== undefined
  ) {
    snapshot.preset = query.preset
  }

  if (typeof query.treeExpanded === 'string' || Array.isArray(query.treeExpanded)) {
    const ids = Array.isArray(query.treeExpanded) ? query.treeExpanded : [query.treeExpanded]

    snapshot.treeExpanded = [
      ...new Set(ids.filter((id) => getNonEmptyString({ value: id }) !== undefined)),
    ]
  }

  if (
    query.queryByGroup &&
    typeof query.queryByGroup === 'object' &&
    !Array.isArray(query.queryByGroup)
  ) {
    const groups = Object.entries(query.queryByGroup).filter(
      ([, value]) => value && typeof value === 'object' && !Array.isArray(value),
    )

    if (groups.length > 0) {
      snapshot.queryByGroup = Object.fromEntries(
        groups.map(([key, value]) => [key, getListLayoutQuery({ query: value })]),
      )
    }
  }

  return snapshot
}

export function getSavedListLayoutQuery({
  layout,
  preferences,
}: {
  layout: 'table' | 'tree'
  preferences?: CollectionPreferences
}): CollectionListQueryPreferences {
  const saved = preferences?.layoutQueries?.[layout]

  if (saved !== undefined) {
    return getListLayoutQuery({ query: saved })
  }

  return layout === 'table'
    ? getListLayoutQuery({
        query: {
          groupBy: preferences?.groupBy,
          limit: preferences?.limit,
          preset: preferences?.preset,
          sort: preferences?.sort,
        },
      })
    : {}
}

/** A matching URL marker makes missing scoped fields intentional clears, not restore requests. */
export function resolveListLayoutQuery({
  defaultLimit,
  defaultSort,
  layout,
  preferences,
  query,
}: {
  defaultLimit: number
  defaultSort?: ListQuery['sort']
  layout: 'table' | 'tree'
  preferences?: CollectionPreferences
  query: ListQuery
}): ListQuery {
  const explicit = Object.fromEntries(
    scopedKeys.filter((key) => Object.hasOwn(query, key)).map((key) => [key, query[key]]),
  )
  const scoped = getListLayoutQuery({
    query: {
      ...(query.listLayout === layout ? {} : getSavedListLayoutQuery({ layout, preferences })),
      ...explicit,
    },
  })
  const resolved: ListQuery = { ...query }

  for (const key of scopedKeys) {
    delete resolved[key]
  }

  Object.assign(resolved, scoped)
  resolved.listLayout = layout
  resolved.limit = scoped.limit ?? getPositiveInteger({ value: defaultLimit }) ?? 10
  resolved.page = scoped.page ?? 1

  const sort = scoped.sort ?? getSort({ value: defaultSort })

  if (sort !== undefined) {
    resolved.sort = sort
  }
  if (layout === 'table') {
    delete resolved.treeExpanded
  }

  return resolved
}

function getNonEmptyString({ value }: { value: unknown }): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function getPositiveInteger({ value }: { value: unknown }): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return undefined
  }

  const number = Math.floor(Number(value))

  return Number.isFinite(number) && number > 0 ? number : undefined
}

function getSort({ value }: { value: unknown }): ListQuery['sort'] {
  if (Array.isArray(value)) {
    const fields = value.filter(
      (field): field is string => getNonEmptyString({ value: field }) !== undefined,
    )

    return fields.length > 0 ? fields : undefined
  }

  return getNonEmptyString({ value })
}

function getSerializableObject({ value }: { value: unknown }): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  try {
    const copy = JSON.parse(JSON.stringify(value)) as Record<string, unknown>

    return copy && typeof copy === 'object' && !Array.isArray(copy) && Object.keys(copy).length > 0
      ? copy
      : undefined
  } catch {
    return undefined
  }
}
