import type {
  BranchEntityHeadToken,
  BranchEntityIdentity,
  BranchHeadWrite,
  BranchInheritanceWrite,
} from './transitionTypes.js'
import type {
  BranchHeadID,
  BranchHeadState,
  BranchHeadToken,
  ResolvedBranchScope,
} from './types.js'

import { areBranchScopesEqual, isBranchHeadReadSetCurrent } from './compareBranchHeads.js'

/** Explicit discard restores inheritance; withdrawal preserves a publication audit reference. */
export const planBranchScopeTransition = ({
  action,
  current,
  entity,
  expected,
  originalBase,
  publishedBranchID,
}: {
  action: 'discard' | 'withdraw'
  current: ResolvedBranchScope
  entity: BranchEntityIdentity
  expected: readonly BranchHeadToken[]
  originalBase: BranchHeadToken | null
  publishedBranchID: BranchHeadID
}):
  | {
      inheritance: BranchInheritanceWrite | null
      previousState: BranchHeadState | null
      readSet: readonly BranchEntityHeadToken[]
      status: 'ready'
      write: BranchHeadWrite | null
    }
  | { readSet: readonly BranchEntityHeadToken[]; status: 'noop' }
  | { reason: 'destination-changed'; status: 'conflict' } => {
  if (action === 'discard' && current.branchID === publishedBranchID) {
    throw new Error('Published scopes cannot be discarded into inheritance.')
  }

  if (
    originalBase &&
    (originalBase.branchID !== publishedBranchID ||
      !areBranchScopesEqual({ left: originalBase.scope, right: current.scope }))
  ) {
    throw new Error('Original base must belong to the published branch and selected scope.')
  }

  if (!isBranchHeadReadSetCurrent({ actual: current.readSet, expected })) {
    return { reason: 'destination-changed', status: 'conflict' }
  }

  if (
    (action === 'discard' && current.isInherited) ||
    (action === 'withdraw' && current.state?.type === 'withdrawn' && !current.isInherited)
  ) {
    return { readSet: current.readSet.map((head) => ({ entity, head })), status: 'noop' }
  }

  const local = current.readSet.find((head) => head.branchID === current.branchID)

  if (!local) {
    throw new Error('Transition requires the local head observation.')
  }

  const nextGeneration = (local.generation ?? 0) + 1
  const nextIncarnation = (local.incarnation ?? 0) + 1

  if (!Number.isSafeInteger(nextGeneration) || !Number.isSafeInteger(nextIncarnation)) {
    throw new Error('Head generation exceeds the supported range.')
  }

  return {
    inheritance:
      action === 'discard'
        ? { branchID: current.branchID, entity, nextIncarnation, scope: current.scope }
        : null,
    previousState: current.state,
    readSet: current.readSet.map((head) => ({ entity, head })),
    status: 'ready',
    write:
      action === 'withdraw'
        ? {
            entity,
            head: {
              base:
                current.branchID === publishedBranchID
                  ? null
                  : current.isInherited
                    ? current.source
                    : originalBase,
              branchID: current.branchID,
              generation: nextGeneration,
              incarnation: local.incarnation ?? 0,
              scope: current.scope,
              state: { type: 'withdrawn' },
            },
          }
        : null,
  }
}
