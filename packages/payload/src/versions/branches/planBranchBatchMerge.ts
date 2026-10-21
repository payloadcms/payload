import type {
  BranchBatchMergePlan,
  BranchEntityHeadToken,
  BranchHeadWrite,
  BranchMergeCandidate,
  BranchMergeReceipt,
  BranchMergeSelection,
  BranchTransitionConflict,
} from './transitionTypes.js'
import type { BranchHeadID, BranchHeadState, BranchHeadToken } from './types.js'

import {
  areBranchEntitiesEqual,
  combineBranchEntityReadSets,
  getBranchEntityKey,
  getBranchScopeKey,
} from './compareBranchEntities.js'
import {
  areBranchHeadStatesEqual,
  areBranchHeadTokensEqual,
  areBranchScopesEqual,
  areBranchVersionsEqual,
  isBranchHeadReadSetCurrent,
} from './compareBranchHeads.js'
import {
  isBranchMergeCandidatePending,
  normalizeBranchMergeSelection,
} from './normalizeBranchMergeSelection.js'

/**
 * Plans scoped replacement and receipts without IO or authorization. Inventory includes shared
 * and every configured locale for each selected entity, so shared replacements cannot silently
 * invalidate unselected translations. The executor freezes versions, authorizes overwrite,
 * validates candidate content, then checks the complete read set before committing this plan.
 */
export const planBranchBatchMerge = ({
  candidates,
  destinationBranchID,
  locales,
  publishedBranchID,
  selection,
  shouldOverwrite = false,
  sourceBranchID,
}: {
  candidates: readonly BranchMergeCandidate[]
  destinationBranchID: BranchHeadID
  locales: readonly string[]
  publishedBranchID: BranchHeadID
  selection?: readonly BranchMergeSelection[]
  /** Trusted policy result; never pass an unapproved public flag directly. */
  shouldOverwrite?: boolean
  sourceBranchID: BranchHeadID
}): BranchBatchMergePlan => {
  if (sourceBranchID === destinationBranchID) {
    throw new Error('A branch cannot be merged into itself.')
  }

  for (const candidate of candidates) {
    if (
      candidate.source.branchID !== sourceBranchID ||
      candidate.destination.branchID !== destinationBranchID ||
      !areBranchScopesEqual({ left: candidate.source.scope, right: candidate.destination.scope })
    ) {
      throw new Error('Merge inventory does not match the selected branches and scope.')
    }

    if (
      candidate.base &&
      (candidate.base.branchID !== publishedBranchID ||
        !areBranchScopesEqual({ left: candidate.base.scope, right: candidate.source.scope }))
    ) {
      throw new Error('Original source base must identify the published branch and selected scope.')
    }
  }

  const normalized = normalizeBranchMergeSelection({ candidates, locales, selection })

  if (normalized.status === 'conflict') {
    return normalized
  }

  const { selected } = normalized
  const conflicts: BranchTransitionConflict[] = []
  const writes: BranchHeadWrite[] = []
  const receipts: BranchMergeReceipt[] = []
  const readSets: (readonly BranchEntityHeadToken[])[] = []
  const inventory = new Map<string, Map<string, BranchMergeCandidate>>()
  const selections = new Set(selected)

  for (const candidate of candidates) {
    const key = getBranchEntityKey({ entity: candidate.entity })
    let scopes = inventory.get(key)

    if (!scopes) {
      scopes = new Map()
      inventory.set(key, scopes)
    }

    scopes.set(getBranchScopeKey({ scope: candidate.source.scope }), candidate)
  }

  for (const candidate of selected) {
    const { base, destination, entity, receipt, source } = candidate
    const conflict = (reason: BranchTransitionConflict['reason']) =>
      conflicts.push({ entity, reason, scope: source.scope })

    if (
      !isBranchHeadReadSetCurrent({
        actual: destination.readSet,
        expected: candidate.expectedDestination,
      })
    ) {
      conflict('destination-changed')
      continue
    }

    if (receipt && !isReceiptValid({ candidate })) {
      conflict('receipt-invalid')
      continue
    }

    if (!isBranchMergeCandidatePending({ candidate })) {
      // Reviewed unchanged scopes remain selected for authorization, but do not create receipts.
      readSets.push(
        [source, destination].flatMap((resolved) =>
          resolved.readSet.map((head) => ({ entity, head })),
        ),
      )
      continue
    }

    if (!source.state) {
      conflict('source-missing')
      continue
    }

    const isBaseCurrent = receipt
      ? isBranchHeadReadSetCurrent({
          actual: destination.readSet,
          expected: receipt.destinationReadSet,
        })
      : isOriginalBaseCurrent({
          base: source.isInherited || source.branchID === publishedBranchID ? source.source : base,
          destination: destination.source,
        })

    if (!shouldOverwrite && !isBaseCurrent) {
      conflict('base-changed')
      continue
    }

    const isNoop =
      !destination.isInherited &&
      areBranchHeadStatesEqual({ left: source.state, right: destination.state })
    const localDestination = destination.readSet.find(
      (token) => token.branchID === destinationBranchID,
    )

    if (!localDestination) {
      throw new Error('Destination is missing its local head observation.')
    }

    const nextGeneration = isNoop
      ? localDestination.generation!
      : (localDestination.generation ?? 0) + 1

    if (!Number.isSafeInteger(nextGeneration)) {
      throw new Error('Head generation exceeds the supported range.')
    }

    const nextHead = {
      base:
        destinationBranchID === publishedBranchID
          ? null
          : destination.isInherited
            ? destination.source
            : candidate.destinationBase,
      branchID: destinationBranchID,
      generation: nextGeneration,
      incarnation: localDestination.incarnation ?? 0,
      scope: source.scope,
      state: source.state,
    }

    if (!isNoop) {
      writes.push({ entity, head: nextHead })
    }

    receipts.push({
      destinationBranchID,
      destinationReadSet: isNoop
        ? destination.readSet
        : [
            {
              branchID: destinationBranchID,
              generation: nextGeneration,
              incarnation: localDestination.incarnation ?? 0,
              scope: source.scope,
              state: source.state,
            },
          ],
      entity,
      scope: source.scope,
      sourceBranchID,
      sourceReadSet: source.readSet,
    })
    readSets.push(
      [source, destination].flatMap((resolved) =>
        resolved.readSet.map((head) => ({ entity, head })),
      ),
    )

    const entityCandidates = inventory.get(getBranchEntityKey({ entity }))!
    const shared = entityCandidates.get(getBranchScopeKey({ scope: { type: 'shared' } }))
    const selectedShared =
      shared && selections.has(shared) && isBranchMergeCandidatePending({ candidate: shared })
        ? shared
        : undefined
    const sharedState = selectedShared?.source.state ?? shared?.destination.state ?? null

    if (source.scope.type === 'shared') {
      for (const locale of locales) {
        const localeCandidate = entityCandidates.get(
          getBranchScopeKey({ scope: { type: 'locale', locale } }),
        )

        if (!localeCandidate) {
          throw new Error('Shared promotion requires every destination locale observation.')
        }

        const isSelected =
          selections.has(localeCandidate) &&
          isBranchMergeCandidatePending({ candidate: localeCandidate })
        const localeState = isSelected
          ? localeCandidate.source.state
          : localeCandidate.destination.state

        if (!isStructureCompatible({ localeState, sharedState })) {
          conflicts.push({
            entity,
            reason: 'shared-structure-changed',
            scope: localeCandidate.source.scope,
          })
        }

        readSets.push(localeCandidate.destination.readSet.map((head) => ({ entity, head })))
      }
    } else if (source.state.type === 'version' && source.state.structure) {
      if (!shared || !isStructureCompatible({ localeState: source.state, sharedState })) {
        conflict('shared-structure-changed')
      } else {
        readSets.push(shared.destination.readSet.map((head) => ({ entity, head })))

        if (selectedShared) {
          readSets.push(selectedShared.source.readSet.map((head) => ({ entity, head })))
        }
      }
    }
  }

  if (conflicts.length) {
    return { conflicts, status: 'conflict' }
  }

  return {
    readSet: combineBranchEntityReadSets({ readSets }),
    receipts,
    selected: selected.map(({ entity, source }) => ({ entity, scope: source.scope })),
    status: 'ready',
    writes,
  }
}

const isStructureCompatible = ({
  localeState,
  sharedState,
}: {
  localeState: BranchHeadState | null
  sharedState: BranchHeadState | null
}): boolean =>
  localeState?.type !== 'version' ||
  !localeState.structure ||
  (sharedState?.type === 'version' &&
    areBranchVersionsEqual({
      left: localeState.structure,
      right: sharedState.structure ?? sharedState.version,
    }))

const isOriginalBaseCurrent = ({
  base,
  destination,
}: {
  base: BranchHeadToken | null
  destination: BranchHeadToken
}): boolean => {
  if (!base) {
    return destination.state === null
  }

  if (base.branchID === destination.branchID) {
    return areBranchHeadTokensEqual({ left: base, right: destination })
  }

  // An independently owned destination can still represent the same immutable base content.
  return areBranchHeadStatesEqual({ left: base.state, right: destination.state })
}

const isReceiptValid = ({ candidate }: { candidate: BranchMergeCandidate }): boolean => {
  const { destination, entity, receipt, source } = candidate

  if (
    !receipt ||
    !areBranchEntitiesEqual({ left: receipt.entity, right: entity }) ||
    receipt.sourceBranchID !== source.branchID ||
    receipt.destinationBranchID !== destination.branchID ||
    !areBranchScopesEqual({ left: receipt.scope, right: source.scope }) ||
    receipt.sourceReadSet.length !== 1 ||
    receipt.destinationReadSet.length !== 1
  ) {
    return false
  }

  const previousSource = receipt.sourceReadSet.find((head) => head.branchID === source.branchID)
  const currentSource = source.readSet.find((head) => head.branchID === source.branchID)
  const appliedDestination = receipt.destinationReadSet[0]!

  const isSourceLifetimeCurrent =
    !!previousSource &&
    !!currentSource &&
    (previousSource.incarnation ?? 0) === (currentSource.incarnation ?? 0) &&
    previousSource.generation !== null &&
    currentSource.generation !== null &&
    previousSource.generation <= currentSource.generation

  return (
    isSourceLifetimeCurrent &&
    areBranchHeadStatesEqual({
      left: previousSource?.state ?? null,
      right: appliedDestination.state,
    }) &&
    appliedDestination.branchID === destination.branchID &&
    appliedDestination.generation !== null &&
    areBranchScopesEqual({ left: appliedDestination.scope, right: source.scope }) &&
    receipt.sourceReadSet.every((head) =>
      areBranchScopesEqual({ left: head.scope, right: source.scope }),
    ) &&
    isBranchHeadReadSetCurrent({ actual: receipt.sourceReadSet, expected: receipt.sourceReadSet })
  )
}
