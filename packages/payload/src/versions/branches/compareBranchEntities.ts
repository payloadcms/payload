import type { BranchEntityHeadToken, BranchEntityIdentity } from './transitionTypes.js'
import type { BranchContentScope, BranchHeadID } from './types.js'

import { areBranchHeadTokensEqual } from './compareBranchHeads.js'

export const getBranchEntityKey = ({ entity }: { entity: BranchEntityIdentity }): string => {
  if (entity.type === 'global') {
    if (!entity.global.length) {
      throw new Error('A branch entity requires a global slug.')
    }

    return JSON.stringify(['global', entity.global])
  }

  if (
    !entity.collection.length ||
    (typeof entity.id === 'number' ? !Number.isFinite(entity.id) : !entity.id.length)
  ) {
    throw new Error('Invalid branch entity collection or logical ID.')
  }

  return JSON.stringify(['collection', entity.collection, entity.id])
}

export const getBranchScopeKey = ({ scope }: { scope: BranchContentScope }): string =>
  JSON.stringify(scope.type === 'shared' ? ['shared'] : ['locale', scope.locale])

export const getBranchEntityScopeKey = ({
  entity,
  scope,
}: {
  entity: BranchEntityIdentity
  scope: BranchContentScope
}): string => JSON.stringify([getBranchEntityKey({ entity }), getBranchScopeKey({ scope })])

export const areBranchEntitiesEqual = ({
  left,
  right,
}: {
  left: BranchEntityIdentity
  right: BranchEntityIdentity
}): boolean => {
  if (left.type === 'global' || right.type === 'global') {
    return left.type === 'global' && right.type === 'global' && left.global === right.global
  }

  return left.collection === right.collection && left.id === right.id
}

export const isBranchEntityReadSetCurrent = ({
  actual,
  expected,
}: {
  actual: readonly BranchEntityHeadToken[]
  expected: readonly BranchEntityHeadToken[]
}): boolean => {
  if (actual.length !== expected.length) {
    return false
  }

  const index = new Map<string, BranchEntityHeadToken>()

  for (const token of actual) {
    const key = getHeadKey({
      branchID: token.head.branchID,
      entity: token.entity,
      scope: token.head.scope,
    })

    if (index.has(key)) {
      return false
    }

    index.set(key, token)
  }

  for (const token of expected) {
    const key = getHeadKey({
      branchID: token.head.branchID,
      entity: token.entity,
      scope: token.head.scope,
    })
    const match = index.get(key)

    if (!match || !areBranchHeadTokensEqual({ left: match.head, right: token.head })) {
      return false
    }

    index.delete(key)
  }

  return true
}

/** Deduplicate identical observations, refusing contradictory observations of one head. */
export const combineBranchEntityReadSets = ({
  readSets,
}: {
  readSets: readonly (readonly BranchEntityHeadToken[])[]
}): readonly BranchEntityHeadToken[] => {
  const combined = new Map<string, BranchEntityHeadToken>()

  for (const token of readSets.flat()) {
    const key = getHeadKey({
      branchID: token.head.branchID,
      entity: token.entity,
      scope: token.head.scope,
    })
    const previous = combined.get(key)

    if (!previous) {
      combined.set(key, token)
    } else if (!areBranchHeadTokensEqual({ left: previous.head, right: token.head })) {
      throw new Error('Contradictory observations of one entity head.')
    }
  }

  return [...combined.values()]
}

const getHeadKey = ({
  branchID,
  entity,
  scope,
}: {
  branchID: BranchHeadID
  entity: BranchEntityIdentity
  scope: BranchContentScope
}): string =>
  JSON.stringify([getBranchEntityKey({ entity }), branchID, getBranchScopeKey({ scope })])
