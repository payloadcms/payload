import type {
  BranchMergeCandidate,
  BranchMergeSelection,
  BranchTransitionConflict,
} from './transitionTypes.js'

import {
  areBranchEntitiesEqual,
  getBranchEntityScopeKey,
  isBranchEntityReadSetCurrent,
} from './compareBranchEntities.js'
import {
  areBranchHeadStatesEqual,
  areBranchScopesEqual,
  isBranchHeadReadSetCurrent,
} from './compareBranchHeads.js'

/** Omission selects pending work; explicit empty selection never expands to pending work. */
export const normalizeBranchMergeSelection = ({
  candidates,
  locales,
  selection,
}: {
  candidates: readonly BranchMergeCandidate[]
  locales: readonly string[]
  selection?: readonly BranchMergeSelection[]
}):
  | { conflicts: readonly BranchTransitionConflict[]; status: 'conflict' }
  | { selected: readonly BranchMergeCandidate[]; status: 'ready' } => {
  if (new Set(locales).size !== locales.length || locales.some((locale) => !locale)) {
    throw new Error('Configured locales must be unique and nonempty.')
  }

  const inventory = new Map<string, BranchMergeCandidate>()

  for (const candidate of candidates) {
    const scope = candidate.source.scope

    if (scope.type === 'locale' && !locales.includes(scope.locale)) {
      throw new Error('Candidate selects an unknown locale.')
    }

    const key = getBranchEntityScopeKey({ entity: candidate.entity, scope })

    if (inventory.has(key)) {
      throw new Error('Duplicate entity scope in merge inventory.')
    }

    inventory.set(key, candidate)
  }

  if (selection === undefined) {
    return {
      selected: candidates.filter((candidate) => isBranchMergeCandidatePending({ candidate })),
      status: 'ready',
    }
  }

  const selected: BranchMergeCandidate[] = []
  const selectedKeys = new Set<string>()
  const conflicts: BranchTransitionConflict[] = []

  for (const item of selection) {
    const scopes = item.scopes.flatMap((scope) =>
      scope === 'all-locales'
        ? locales.map((locale) => ({ type: 'locale' as const, locale }))
        : [scope],
    )
    const selectedForItem: BranchMergeCandidate[] = []

    if (!scopes.length && (item.expectedSource.length || item.expectedPending.length)) {
      throw new Error('An empty scope selection cannot include source expectations.')
    }

    if (
      item.expectedPending.some(
        (pending) => !scopes.some((scope) => areBranchScopesEqual({ left: pending, right: scope })),
      )
    ) {
      throw new Error('Pending expectations must belong to the selected scopes.')
    }

    for (const scope of scopes) {
      if (scope.type === 'locale' && !locales.includes(scope.locale)) {
        throw new Error('Selection contains an unknown locale.')
      }

      const key = getBranchEntityScopeKey({ entity: item.entity, scope })
      const candidate = inventory.get(key)

      if (!candidate) {
        conflicts.push({ entity: item.entity, reason: 'selection-missing', scope })
      } else if (selectedKeys.has(key)) {
        throw new Error('A scope cannot be selected more than once.')
      } else {
        selected.push(candidate)
        selectedKeys.add(key)
        selectedForItem.push(candidate)

        const wasPending = item.expectedPending.some((pending) =>
          areBranchScopesEqual({ left: pending, right: scope }),
        )

        if (isBranchMergeCandidatePending({ candidate }) !== wasPending) {
          conflicts.push({ entity: item.entity, reason: 'selection-missing', scope })
        }
      }
    }

    if (
      !isBranchEntityReadSetCurrent({
        actual: selectedForItem.flatMap((candidate) =>
          candidate.source.readSet.map((head) => ({ entity: candidate.entity, head })),
        ),
        expected: item.expectedSource,
      })
    ) {
      conflicts.push(
        ...scopes.map((scope) => ({
          entity: item.entity,
          reason: 'source-changed' as const,
          scope,
        })),
      )
    }
  }

  return conflicts.length ? { conflicts, status: 'conflict' } : { selected, status: 'ready' }
}

export const isBranchMergeCandidatePending = ({
  candidate,
}: {
  candidate: BranchMergeCandidate
}): boolean => {
  const { destination, receipt, source } = candidate

  if (!source.state || source.isInherited) {
    return false
  }

  return !(
    receipt &&
    areBranchHeadStatesEqual({ left: source.state, right: destination.state }) &&
    areBranchEntitiesEqual({ left: receipt.entity, right: candidate.entity }) &&
    receipt.sourceBranchID === source.branchID &&
    receipt.destinationBranchID === destination.branchID &&
    areBranchScopesEqual({ left: receipt.scope, right: source.scope }) &&
    isBranchHeadReadSetCurrent({ actual: source.readSet, expected: receipt.sourceReadSet }) &&
    isBranchHeadReadSetCurrent({
      actual: destination.readSet,
      expected: receipt.destinationReadSet,
    })
  )
}
