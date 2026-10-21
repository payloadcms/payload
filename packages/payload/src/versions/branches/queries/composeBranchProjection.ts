import type { BranchScopeField } from '../compileBranchScopeFields.js'
import type {
  BranchContentScope,
  BranchHeadID,
  BranchHeadState,
  BranchVersionReference,
} from '../types.js'

import { areBranchHeadStatesEqual } from '../compareBranchHeads.js'
import { composeBranchScopeData } from '../composeBranchScopeData.js'
import { getBranchSharedStructure } from '../getBranchSharedStructure.js'
import { projectBranchScopeData } from '../projectBranchScopeData.js'

export type BranchProjectionScope = {
  main: BranchHeadState | null
  scope: BranchContentScope
  selected: BranchHeadState | null
}

/** Complete effective raw content; a conflicting translation never supplies stale rows. */
export const composeBranchProjection = ({
  fields,
  isStatusLocalized = false,
  logicalID,
  scopes,
  versions,
}: {
  fields: readonly BranchScopeField[]
  isStatusLocalized?: boolean
  logicalID: BranchHeadID
  scopes: readonly BranchProjectionScope[]
  versions: readonly { data: Record<string, unknown>; reference: BranchVersionReference }[]
}): {
  conflictedLocales: string[]
  data: Record<string, unknown>
  hasSharedContent: boolean
} => {
  const snapshots = new Map(
    versions.map(({ data, reference }) => [getVersionKey({ reference }), data]),
  )
  const sharedScope = scopes.find(({ scope }) => scope.type === 'shared')

  if (!sharedScope || scopes.filter(({ scope }) => scope.type === 'shared').length !== 1) {
    throw new Error('A branch projection requires exactly one shared scope.')
  }

  const getData = ({ state }: { state: BranchHeadState | null }): Record<string, unknown> => {
    if (state?.type !== 'version') {
      return {}
    }

    const data = snapshots.get(getVersionKey({ reference: state.version }))

    if (!data) {
      throw new Error('A branch projection references a missing version revision.')
    }

    return data
  }
  const sharedData = getData({ state: sharedScope.selected })
  const shared = projectBranchScopeData({ data: sharedData, fields, scope: { type: 'shared' } })
  const sharedStructure = getBranchSharedStructure({ data: shared, fields })
  const conflictedLocales: string[] = []
  const locales: { data: Record<string, unknown>; locale: string }[] = []
  const statuses: Record<string, 'draft' | 'published'> = {}
  const hasLiveSharedSelection =
    areBranchHeadStatesEqual({ left: sharedScope.selected, right: sharedScope.main }) &&
    sharedScope.selected?.type === 'version'

  for (const { main, scope, selected } of scopes) {
    if (scope.type !== 'locale') {
      continue
    }

    if (Object.hasOwn(statuses, scope.locale)) {
      throw new Error('A locale may only be selected once in a branch projection.')
    }

    statuses[scope.locale] = 'draft'

    if (selected?.type !== 'version' || sharedScope.selected?.type !== 'version') {
      continue
    }

    const localeData = projectBranchScopeData({ data: getData({ state: selected }), fields, scope })
    const localeStructure = getBranchSharedStructure({ data: localeData, fields })

    const declaredSnapshot = selected.structure
      ? snapshots.get(getVersionKey({ reference: selected.structure }))
      : null
    if (selected.structure && !declaredSnapshot) {
      throw new Error('A branch projection references a missing structure revision.')
    }
    const declaredStructure = declaredSnapshot
      ? getBranchSharedStructure({
          data: projectBranchScopeData({
            data: declaredSnapshot,
            fields,
            scope: { type: 'shared' },
          }),
          fields,
        })
      : localeStructure

    if (
      !hasCompatibleStructure({ actual: declaredStructure, required: localeStructure }) ||
      !hasCompatibleStructure({ actual: sharedStructure, required: declaredStructure })
    ) {
      conflictedLocales.push(scope.locale)
      continue
    }

    locales.push({ data: localeData, locale: scope.locale })
    statuses[scope.locale] =
      hasLiveSharedSelection && areBranchHeadStatesEqual({ left: selected, right: main })
        ? 'published'
        : 'draft'
  }

  const data = composeBranchScopeData({ fields, locales, shared })

  data.id = logicalID
  const localeScopes = scopes.filter(({ scope }) => scope.type === 'locale')
  const hasLiveLocaleSelection = localeScopes.some(
    ({ main, selected }) =>
      selected?.type === 'version' && areBranchHeadStatesEqual({ left: selected, right: main }),
  )
  const areLocaleSelectionsLive = localeScopes.every(
    ({ main, selected }) =>
      selected?.type !== 'withdrawn' && areBranchHeadStatesEqual({ left: selected, right: main }),
  )
  const isScalarPublished =
    hasLiveSharedSelection &&
    areLocaleSelectionsLive &&
    conflictedLocales.length === 0 &&
    (!hasLocalizedContent({ fields }) || hasLiveLocaleSelection)

  data._status = isStatusLocalized ? statuses : isScalarPublished ? 'published' : 'draft'

  for (const key of ['createdAt', 'updatedAt']) {
    if (Object.hasOwn(sharedData, key)) {
      data[key] = sharedData[key]
    }
  }

  return { conflictedLocales, data, hasSharedContent: sharedScope.selected?.type === 'version' }
}

const getVersionKey = ({ reference }: { reference: BranchVersionReference }): string =>
  JSON.stringify([typeof reference.id, reference.id, reference.generation])

const hasCompatibleStructure = ({
  actual,
  required,
}: {
  actual: Record<string, unknown>
  required: Record<string, unknown>
}): boolean => {
  for (const [key, requiredValue] of Object.entries(required)) {
    if (JSON.stringify(actual[key]) !== JSON.stringify(requiredValue)) {
      return false
    }
  }

  return true
}

/** Locale availability comes from heads; schema localization only determines whether locale publication is required. */
const hasLocalizedContent = ({
  fields,
  visited = new Set<readonly BranchScopeField[]>(),
}: {
  fields: readonly BranchScopeField[]
  visited?: Set<readonly BranchScopeField[]>
}): boolean => {
  if (visited.has(fields)) {
    return false
  }
  visited.add(fields)
  return fields.some((field) =>
    field.type === 'value'
      ? field.isLocalized
      : field.type === 'blocks'
        ? [...field.blocks.values()].some((fields) => hasLocalizedContent({ fields, visited }))
        : hasLocalizedContent({ fields: field.fields, visited }),
  )
}
