import type {
  BranchContentScope,
  BranchHead,
  BranchHeadID,
  BranchHeadToken,
  ResolvedBranchScope,
} from './types.js'

export type BranchEntityIdentity =
  | Readonly<{ collection: string; id: BranchHeadID; type: 'collection' }>
  | Readonly<{ global: string; type: 'global' }>

/** Database read conditions always include the logical entity, including custom ID type. */
export type BranchEntityHeadToken = Readonly<{
  entity: BranchEntityIdentity
  head: BranchHeadToken
}>

/** A committed receipt is destination specific; another destination cannot reuse its base. */
export type BranchMergeReceipt = Readonly<{
  destinationBranchID: BranchHeadID
  destinationReadSet: readonly BranchHeadToken[]
  entity: BranchEntityIdentity
  scope: BranchContentScope
  sourceBranchID: BranchHeadID
  sourceReadSet: readonly BranchHeadToken[]
}>

export type BranchMergeCandidate = Readonly<{
  /** The effective main token captured before the source first became owned. */
  base: BranchHeadToken | null
  destination: ResolvedBranchScope
  /** Preserve an owned destination's original base; inherited destinations capture main. */
  destinationBase: BranchHeadToken | null
  entity: BranchEntityIdentity
  /** Reviewed destination state; overwrite never bypasses this concurrency check. */
  expectedDestination: readonly BranchHeadToken[]
  receipt: BranchMergeReceipt | null
  source: ResolvedBranchScope
}>

export type BranchMergeSelection = Readonly<{
  entity: BranchEntityIdentity
  /** Scopes that were pending during review; becoming applied or inherited is a conflict. */
  expectedPending: readonly BranchContentScope[]
  /** Exact source observations captured by review, not internal change-record IDs. */
  expectedSource: readonly BranchEntityHeadToken[]
  scopes: readonly ('all-locales' | BranchContentScope)[]
}>

export type BranchTransitionConflict = Readonly<{
  entity: BranchEntityIdentity
  reason:
    | 'base-changed'
    | 'destination-changed'
    | 'receipt-invalid'
    | 'selection-missing'
    | 'shared-structure-changed'
    | 'source-changed'
    | 'source-missing'
  scope: BranchContentScope
}>

export type BranchHeadWrite = Readonly<{
  entity: BranchEntityIdentity
  head: BranchHead
}>

/**
 * Discard is an atomic override removal AND durable guard advance. The guard survives absence
 * and is copied into later heads; deleting/recreating a row at generation one alone is unsafe.
 */
export type BranchInheritanceWrite = Readonly<{
  branchID: BranchHeadID
  entity: BranchEntityIdentity
  nextIncarnation: number
  scope: BranchContentScope
}>

export type BranchBatchMergePlan =
  | Readonly<{
      /** Check every condition and persist writes and receipts in one supported boundary. */
      readSet: readonly BranchEntityHeadToken[]
      receipts: readonly BranchMergeReceipt[]
      selected: readonly Readonly<{ entity: BranchEntityIdentity; scope: BranchContentScope }>[]
      status: 'ready'
      writes: readonly BranchHeadWrite[]
    }>
  | Readonly<{ conflicts: readonly BranchTransitionConflict[]; status: 'conflict' }>
