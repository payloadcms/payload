import { isDeepStrictEqual } from 'node:util'

import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { BranchScopeField } from '../compileBranchScopeFields.js'
import type { BranchStorageTarget } from '../storage/branchStorage.js'
import type { BranchHeadID, BranchHeadToken, BranchVersionReference } from '../types.js'

import { areBranchHeadTokensEqual } from '../compareBranchHeads.js'
import { projectBranchScopeData } from '../projectBranchScopeData.js'
import { readBranchHeadToken } from '../storage/branchHeadStore.js'
import { getBranchKey, getBranchStorage } from '../storage/branchStorage.js'
import { readBranchVersion } from '../storage/branchVersionStore.js'

/** Undefined object properties have no native JSON content identity. */
export const areBranchAutosaveScopesEqual = ({
  left,
  right,
}: {
  left: unknown
  right: unknown
}): boolean =>
  isDeepStrictEqual(
    omitUndefinedObjectProperties({ value: left }),
    omitUndefinedObjectProperties({ value: right }),
  )

export type BranchAutosaveOwnership = {
  closure: readonly BranchHeadToken[]
  previous: JsonObject
  reference: BranchVersionReference
}

/** Pure reference transition description, also consumable by the later atomic-batch compiler. */
export const planBranchAutosaveOwnership = ({
  branchID,
  data,
  fields,
  hasSharedChange,
  observed,
  reference,
  references,
  selected,
  stored,
}: {
  branchID: BranchHeadID
  data: JsonObject
  fields: readonly BranchScopeField[]
  hasSharedChange: boolean
  observed: readonly BranchHeadToken[]
  reference: BranchVersionReference
  references: readonly BranchHeadToken[]
  selected: readonly BranchHeadToken[]
  stored: JsonObject
}): BranchAutosaveOwnership | null => {
  const closure: BranchHeadToken[] = []

  for (const token of references) {
    if (
      token.branchID !== branchID ||
      token.state?.type !== 'version' ||
      token.state.version.id !== reference.id ||
      token.state.version.generation !== reference.generation ||
      token.state.structure?.id === reference.id
    ) {
      return null
    }
    const expected = observed.find((observation) =>
      areBranchHeadTokensEqual({ left: observation, right: token }),
    )

    if (!expected) {
      throw new Error('An autosave ownership head changed after operation observations.')
    }
    const isSelected = selected.some((selection) =>
      areBranchHeadTokensEqual({ left: selection, right: token }),
    )

    if (!isSelected) {
      if (
        hasSharedChange ||
        !areBranchAutosaveScopesEqual({
          left: projectBranchScopeData({ data, fields, scope: token.scope }),
          right: projectBranchScopeData({ data: stored, fields, scope: token.scope }),
        })
      ) {
        return null
      }
      const status = (value: JsonObject) =>
        token.scope.type === 'locale' && value._status && typeof value._status === 'object'
          ? value._status[token.scope.locale]
          : value._status

      if (!isDeepStrictEqual(status(data), status(stored))) {
        return null
      }
    }
    closure.push(expected)
  }

  return closure.length ? { closure, previous: stored, reference } : null
}

/** Native reads only discover candidates; the version CAS serializes every freeze/pin writer. */
export const prepareBranchAutosave = async ({
  branchID,
  data,
  fields,
  hasSharedChange,
  readSet,
  req,
  selected,
  target,
}: {
  branchID: BranchHeadID
  data: JsonObject
  fields: readonly BranchScopeField[]
  hasSharedChange: boolean
  readSet: readonly BranchHeadToken[]
  req: PayloadRequest
  selected: readonly BranchHeadToken[]
  target: BranchStorageTarget
}): Promise<BranchAutosaveOwnership | null> => {
  const local = readSet.filter((token) => token.branchID === branchID)
  const hasLocales = local.some((token) => token.scope.type === 'locale')
  const content = local.filter((token) => !hasLocales || token.scope.type === 'locale')
  const ownedSelected = content.filter(
    (token) => selected.includes(token) && token.state?.type === 'version',
  )
  const candidates = ownedSelected.length
    ? ownedSelected
    : content.filter((token) => token.state?.type === 'version')
  const first = candidates[0]

  if (first?.state?.type !== 'version') {
    return null
  }
  const reference = first.state.version

  if (
    candidates.some(
      (token) =>
        token.state?.type !== 'version' ||
        token.state.version.id !== reference.id ||
        token.state.version.generation !== reference.generation,
    )
  ) {
    return null
  }
  const { entity, heads, pins } = getBranchStorage({ req, target })
  const row = await readBranchVersion({ entity, req, versionID: reference.id })

  if (!row || row.branchGeneration !== reference.generation) {
    throw new Error('The observed autosave revision changed.')
  }
  if (
    row.autosave !== true ||
    row.branchFrozen !== false ||
    (branchID === 'drafts' && row.latest !== true) ||
    row.branchOwnerKey !== getBranchKey({ branchID }) ||
    (branchID === 'drafts' ? row.branchOnly === true : row.branchOnly !== true)
  ) {
    return null
  }
  const parent = entity.type === 'collection' ? [{ parent: { equals: entity.parentID } }] : []
  const pin = await req.payload.db.findOne({
    collection: pins,
    req,
    where: { and: [{ versionID: { equals: reference.id } }, ...parent] },
  })

  if (pin) {
    return null
  }
  const rows = await req.payload.db.find<Record<string, unknown>>({
    collection: heads,
    limit: 0,
    pagination: false,
    req,
    where: {
      and: [
        ...parent,
        {
          or: [
            { versionID: { equals: reference.id } },
            { structureVersionID: { equals: reference.id } },
          ],
        },
      ],
    },
  })
  const references: BranchHeadToken[] = []

  for (const head of rows.docs) {
    const branchKey = head.branchKey as string
    const referenceBranch = branchKey.startsWith('number:')
      ? Number(branchKey.slice(7))
      : branchKey.slice(7)
    const scopeKey = head.scopeKey as string
    const token = await readBranchHeadToken({
      branchID: referenceBranch,
      req,
      scope:
        scopeKey === 'shared' ? { type: 'shared' } : { type: 'locale', locale: scopeKey.slice(7) },
      target,
    })

    references.push(token)
  }

  return planBranchAutosaveOwnership({
    branchID,
    data,
    fields,
    hasSharedChange,
    observed: readSet,
    reference,
    references,
    selected,
    stored: row.version as JsonObject,
  })
}

const omitUndefinedObjectProperties = ({ value }: { value: unknown }): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => omitUndefinedObjectProperties({ value: entry }))
  }
  if (
    !value ||
    typeof value !== 'object' ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  ) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, omitUndefinedObjectProperties({ value: entry })]),
  )
}
