import { isDeepStrictEqual } from 'node:util'

import type { BranchScopeField } from '../compileBranchScopeFields.js'
import type {
  BranchContentScope,
  BranchHead,
  BranchHeadID,
  BranchHeadState,
  BranchVersionReference,
} from '../types.js'

import { getBranchSharedStructure } from '../getBranchSharedStructure.js'
import { hasSharedBranchStructure } from '../hasLocalizedBranchFields.js'
import { projectBranchScopeData } from '../projectBranchScopeData.js'

type LegacySource = {
  data: Record<string, unknown>
  /** The cutover runner must freeze this exact revision before applying the plan. */
  version: BranchVersionReference
}

export type LegacyBranchHeadPlan = {
  heads: BranchHead[]
  /** Preserve legacy draft response metadata even when content can safely inherit main. */
  legacyWorkingVersion: BranchVersionReference | null
}

/**
 * Plans one identity's initial heads from its actual materialization and resolved working view.
 * It never searches historical published versions, creates content, or changes stored statuses.
 * The offline runner owns baseline creation, source selection, freezing, and resumability.
 */
export const planLegacyBranchHeads = ({
  draftsBranchID = 'drafts',
  fields,
  locales,
  materialized,
  publishedBranchID = 'main',
  statusMode,
  working,
}: {
  draftsBranchID?: BranchHeadID
  fields: readonly BranchScopeField[]
  locales: readonly string[]
  materialized: LegacySource | null
  publishedBranchID?: BranchHeadID
  statusMode: 'localized' | 'scalar'
  working: LegacySource | null
}): LegacyBranchHeadPlan => {
  if (draftsBranchID === publishedBranchID) {
    throw new Error('Published and drafts branches must have different identities.')
  }

  if (new Set(locales).size !== locales.length || locales.some((locale) => !locale.length)) {
    throw new Error('Migration locales must be distinct nonempty locale codes.')
  }

  if (statusMode === 'localized' && !locales.length) {
    throw new Error('Localized publication requires configured locales.')
  }

  const currentWorking = working ?? materialized

  for (const source of [materialized, currentWorking]) {
    if (
      source &&
      (!Number.isSafeInteger(source.version.generation) ||
        source.version.generation < 1 ||
        ((typeof source.version.id !== 'number' || !Number.isSafeInteger(source.version.id)) &&
          (typeof source.version.id !== 'string' || !source.version.id.length)))
    ) {
      throw new Error('Migration sources require valid version identities and generations.')
    }
  }

  if (
    materialized &&
    currentWorking &&
    materialized.version.id === currentWorking.version.id &&
    (materialized.version.generation !== currentWorking.version.generation ||
      !isDeepStrictEqual(materialized.data, currentWorking.data))
  ) {
    throw new Error('A migration version identity cannot describe different source snapshots.')
  }

  const result: LegacyBranchHeadPlan = {
    heads: [],
    legacyWorkingVersion: currentWorking?.version ?? null,
  }

  if (!materialized && !currentWorking) {
    return result
  }

  const sharedScope: BranchContentScope = { type: 'shared' }
  const hasStructure = hasSharedBranchStructure({ fields })
  const liveStructure = hasStructure && materialized ? materialized.version : null
  const workingStructure =
    hasStructure && currentWorking
      ? materialized &&
        isDeepStrictEqual(
          getBranchSharedStructure({ data: materialized.data, fields }),
          getBranchSharedStructure({ data: currentWorking.data, fields }),
        )
        ? materialized.version
        : currentWorking.version
      : null
  const sharedState: BranchHeadState =
    materialized &&
    (locales.length > 0 || isPublished({ locale: undefined, materialized, statusMode }))
      ? { type: 'version', structure: liveStructure, version: materialized.version }
      : { type: 'withdrawn' }
  const sharedHead: BranchHead = {
    base: null,
    branchID: publishedBranchID,
    generation: 1,
    scope: sharedScope,
    state: sharedState,
  }

  result.heads.push(sharedHead)

  const sharedWorkingHead = getWorkingHead({
    currentWorking,
    fields,
    main: sharedHead,
    materialized,
    structure: workingStructure,
    workingBranchID: draftsBranchID,
  })

  if (sharedWorkingHead) {
    result.heads.push(sharedWorkingHead)
  }

  for (const locale of locales) {
    const scope: BranchContentScope = { type: 'locale', locale }
    const main: BranchHead = {
      base: null,
      branchID: publishedBranchID,
      generation: 1,
      scope,
      state:
        materialized && isPublished({ locale, materialized, statusMode })
          ? { type: 'version', structure: liveStructure, version: materialized.version }
          : { type: 'withdrawn' },
    }

    result.heads.push(main)

    const workingHead = getWorkingHead({
      currentWorking,
      fields,
      main,
      materialized,
      structure: workingStructure,
      workingBranchID: draftsBranchID,
    })

    if (workingHead) {
      result.heads.push(workingHead)
    }
  }

  return result
}

const getWorkingHead = ({
  currentWorking,
  fields,
  main,
  materialized,
  structure = null,
  workingBranchID,
}: {
  currentWorking: LegacySource | null
  fields: readonly BranchScopeField[]
  main: BranchHead
  materialized: LegacySource | null
  structure?: BranchVersionReference | null
  workingBranchID: BranchHeadID
}): BranchHead | null => {
  if (!currentWorking) {
    return null
  }

  if (
    main.state.type === 'version' &&
    materialized &&
    isDeepStrictEqual(
      getComparableScopeData({ data: materialized.data, fields, scope: main.scope }),
      getComparableScopeData({ data: currentWorking.data, fields, scope: main.scope }),
    ) &&
    isDeepStrictEqual(main.state.structure, structure)
  ) {
    return null
  }

  return {
    base: {
      branchID: main.branchID,
      generation: main.generation,
      scope: main.scope,
      state: main.state,
    },
    branchID: workingBranchID,
    generation: 1,
    scope: main.scope,
    state: { type: 'version', structure, version: currentWorking.version },
  }
}

const getComparableScopeData = ({
  data,
  fields,
  scope,
}: {
  data: Record<string, unknown>
  fields: readonly BranchScopeField[]
  scope: BranchContentScope
}): Record<string, unknown> => {
  const projected = projectBranchScopeData({ data, fields, scope })

  return scope.type === 'locale' ? getLocaleAttachments({ data: projected, fields }) : projected
}

/** Shared row order is not part of a locale attachment; localized containers remain atomic. */
const getLocaleAttachments = ({
  data,
  fields,
}: {
  data: Record<string, unknown>
  fields: readonly BranchScopeField[]
}): Record<string, unknown> => {
  const fieldsByName = new Map(fields.map((field) => [field.name, field]))

  return Object.fromEntries(
    Object.entries(data).map(([name, value]) => {
      const field = fieldsByName.get(name)

      if (!field || field.type === 'value') {
        return [name, value]
      }

      if (field.type === 'group') {
        return [
          name,
          getLocaleAttachments({ data: value as Record<string, unknown>, fields: field.fields }),
        ]
      }

      const attachments = new Map<BranchHeadID, Record<string, unknown>>()

      for (const row of value as Record<string, unknown>[]) {
        const id = row.id
        const rowFields =
          field.type === 'blocks' ? field.blocks.get(String(row.blockType)) : field.fields

        if (
          ((typeof id !== 'number' || !Number.isFinite(id)) &&
            (typeof id !== 'string' || !id.length)) ||
          attachments.has(id as BranchHeadID) ||
          !rowFields
        ) {
          throw new Error(`Invalid locale attachment identity in field "${name}".`)
        }

        attachments.set(id as BranchHeadID, getLocaleAttachments({ data: row, fields: rowFields }))
      }

      return [name, attachments]
    }),
  )
}

const isPublished = ({
  locale,
  materialized,
  statusMode,
}: {
  locale: string | undefined
  materialized: LegacySource
  statusMode: 'localized' | 'scalar'
}): boolean => {
  const rawStatus = materialized.data._status
  let status: unknown

  if (statusMode === 'scalar') {
    status = rawStatus
  } else {
    if (rawStatus != null && (typeof rawStatus !== 'object' || Array.isArray(rawStatus))) {
      throw new Error('Expected localized publication state in migration source.')
    }

    status =
      locale && rawStatus && Object.hasOwn(rawStatus, locale)
        ? (rawStatus as Record<string, unknown>)[locale]
        : undefined
  }

  if (status != null && status !== 'draft' && status !== 'published') {
    throw new Error('Invalid publication state in migration source.')
  }

  return status === 'published'
}
