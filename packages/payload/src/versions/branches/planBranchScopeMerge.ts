import type { BranchHeadToken, BranchScopeMergePlan, ResolvedBranchScope } from './types.js'

import {
  areBranchHeadStatesEqual,
  areBranchScopesEqual,
  areBranchVersionsEqual,
  isBranchHeadReadSetCurrent,
} from './compareBranchHeads.js'

/**
 * Preliminary comparison of one scope, not a commit-ready transition or authorization result.
 * Its overwrite and no-op results omit required review/receipt guards. Execution must use
 * planBranchBatchMerge, which retains reviewed tokens, merge bases, receipts and full closure.
 * `destinationSharedScope` supplies the shared candidate and its original read preconditions.
 * A batch that also replaces shared content must include that replacement's source preconditions.
 */
export const planBranchScopeMerge = ({
  destination,
  destinationSharedScope = null,
  expectedDestination,
  shouldOverwrite = false,
  source,
}: {
  destination: ResolvedBranchScope
  destinationSharedScope?: null | ResolvedBranchScope
  expectedDestination: readonly BranchHeadToken[]
  shouldOverwrite?: boolean
  source: ResolvedBranchScope
}): BranchScopeMergePlan => {
  if (source.branchID === destination.branchID) {
    throw new Error('A branch cannot be merged into itself.')
  }

  if (!areBranchScopesEqual({ left: source.scope, right: destination.scope })) {
    throw new Error('Source and destination must select the same content scope.')
  }

  if (
    destinationSharedScope &&
    (destinationSharedScope.branchID !== destination.branchID ||
      destinationSharedScope.scope.type !== 'shared')
  ) {
    throw new Error('Shared content must belong to the destination branch and shared scope.')
  }

  if (!source.state) {
    return { reason: 'source-missing', status: 'conflict' }
  }

  if (
    !shouldOverwrite &&
    !isBranchHeadReadSetCurrent({ actual: destination.readSet, expected: expectedDestination })
  ) {
    return { reason: 'destination-changed', status: 'conflict' }
  }

  let dependencyReadSet: readonly BranchHeadToken[] = []

  if (
    source.scope.type === 'locale' &&
    source.state.type === 'version' &&
    source.state.structure !== null
  ) {
    if (
      destinationSharedScope?.state?.type !== 'version' ||
      !areBranchVersionsEqual({
        left: source.state.structure,
        right: destinationSharedScope.state.structure ?? destinationSharedScope.state.version,
      })
    ) {
      return { reason: 'shared-structure-changed', status: 'conflict' }
    }

    dependencyReadSet = destinationSharedScope.readSet
  }

  // Matching inherited content still needs an owned head so later main changes cannot move staging.
  if (
    !destination.isInherited &&
    areBranchHeadStatesEqual({ left: source.state, right: destination.state })
  ) {
    return { status: 'noop' }
  }

  return {
    dependencyReadSet,
    destinationReadSet: destination.readSet,
    nextState: source.state,
    sourceReadSet: source.readSet,
    status: 'ready',
  }
}
