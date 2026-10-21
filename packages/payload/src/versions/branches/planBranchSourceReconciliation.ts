import type {
  BranchEntityHeadToken,
  BranchEntityIdentity,
  BranchInheritanceWrite,
  BranchMergeReceipt,
} from './transitionTypes.js'
import type { BranchHeadID, ResolvedBranchScope } from './types.js'

import { areBranchEntitiesEqual, combineBranchEntityReadSets } from './compareBranchEntities.js'
import {
  areBranchHeadStatesEqual,
  areBranchScopesEqual,
  areBranchVersionsEqual,
  isBranchHeadReadSetCurrent,
} from './compareBranchHeads.js'

/** Reconcile one committed selection only. Unselected source work is never an input or output. */
export const planBranchSourceReconciliation = ({
  currentPublished,
  currentPublishedShared = null,
  currentSource,
  entity,
  publishedBranchID,
  receipt,
}: {
  currentPublished: ResolvedBranchScope
  currentPublishedShared?: null | ResolvedBranchScope
  currentSource: ResolvedBranchScope
  entity: BranchEntityIdentity
  publishedBranchID: BranchHeadID
  receipt: BranchMergeReceipt
}):
  | {
      inheritance: BranchInheritanceWrite
      readSet: readonly BranchEntityHeadToken[]
      status: 'discard'
    }
  | {
      reason: 'inherited' | 'publication-changed' | 'source-changed' | 'working-destination'
      status: 'retain'
    } => {
  if (
    !areBranchEntitiesEqual({ left: entity, right: receipt.entity }) ||
    currentSource.branchID !== receipt.sourceBranchID ||
    !areBranchScopesEqual({ left: currentSource.scope, right: receipt.scope }) ||
    currentPublished.branchID !== publishedBranchID ||
    !areBranchScopesEqual({ left: currentPublished.scope, right: receipt.scope })
  ) {
    throw new Error('Source reconciliation does not match its committed receipt.')
  }

  if (
    receipt.destinationBranchID !== publishedBranchID ||
    currentSource.branchID === publishedBranchID
  ) {
    return { reason: 'working-destination', status: 'retain' }
  }

  if (currentSource.isInherited) {
    return { reason: 'inherited', status: 'retain' }
  }

  if (
    !isBranchHeadReadSetCurrent({ actual: currentSource.readSet, expected: receipt.sourceReadSet })
  ) {
    return { reason: 'source-changed', status: 'retain' }
  }

  if (
    !isBranchHeadReadSetCurrent({
      actual: currentPublished.readSet,
      expected: receipt.destinationReadSet,
    }) ||
    !areBranchHeadStatesEqual({ left: currentSource.state, right: currentPublished.state })
  ) {
    return { reason: 'publication-changed', status: 'retain' }
  }

  const readSets = [currentSource.readSet, currentPublished.readSet]
  const localSource = currentSource.readSet.find((head) => head.branchID === currentSource.branchID)
  const nextIncarnation = (localSource?.incarnation ?? 0) + 1

  if (!localSource || !Number.isSafeInteger(nextIncarnation)) {
    throw new Error('Source reconciliation requires a valid durable incarnation.')
  }

  if (
    currentSource.state?.type === 'version' &&
    currentSource.state.structure &&
    currentSource.scope.type === 'locale'
  ) {
    if (
      !currentPublishedShared ||
      currentPublishedShared.branchID !== publishedBranchID ||
      currentPublishedShared.scope.type !== 'shared' ||
      currentPublishedShared.state?.type !== 'version' ||
      !areBranchVersionsEqual({
        left: currentSource.state.structure,
        right: currentPublishedShared.state.structure ?? currentPublishedShared.state.version,
      })
    ) {
      return { reason: 'publication-changed', status: 'retain' }
    }

    readSets.push(currentPublishedShared.readSet)
  }

  return {
    inheritance: {
      branchID: currentSource.branchID,
      entity,
      nextIncarnation,
      scope: currentSource.scope,
    },
    readSet: combineBranchEntityReadSets({
      readSets: readSets.map((tokens) => tokens.map((head) => ({ entity, head }))),
    }),
    status: 'discard',
  }
}
