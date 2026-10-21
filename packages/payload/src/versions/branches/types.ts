export type BranchHeadID = number | string

export type BranchContentScope =
  | Readonly<{ locale: string; type: 'locale' }>
  | Readonly<{ type: 'shared' }>

export type BranchVersionReference = Readonly<{
  generation: number
  id: BranchHeadID
}>

export type BranchHeadState =
  | Readonly<{
      /** Shared structure required by localized descendants, or null for an independent value. */
      structure: BranchVersionReference | null
      type: 'version'
      version: BranchVersionReference
    }>
  | Readonly<{ type: 'withdrawn' }>

/** Tokens describe one entity's scope. Never compare tokens across document identities. */
export type BranchHeadToken = (
  | Readonly<{ generation: null; state: null }>
  | Readonly<{ generation: number; state: BranchHeadState }>
) &
  Readonly<{
    branchID: BranchHeadID
    scope: BranchContentScope
  }>

export type BranchHead = Readonly<{
  /** State inherited when the scope first became owned; null for an unbased head. */
  base: BranchHeadToken | null
  branchID: BranchHeadID
  generation: number
  scope: BranchContentScope
  state: BranchHeadState
}>

export type ResolvedBranchScope = Readonly<{
  branchID: BranchHeadID
  isInherited: boolean
  /**
   * Both the absent local head and the inherited published head must still match at commit.
   * An owned scope only depends on its local head.
   */
  readSet: readonly BranchHeadToken[]
  scope: BranchContentScope
  source: BranchHeadToken
  state: BranchHeadState | null
}>

export type BranchScopeMergePlan =
  | Readonly<{
      dependencyReadSet: readonly BranchHeadToken[]
      destinationReadSet: readonly BranchHeadToken[]
      nextState: BranchHeadState
      sourceReadSet: readonly BranchHeadToken[]
      status: 'ready'
    }>
  | Readonly<{
      reason: 'destination-changed' | 'shared-structure-changed' | 'source-missing'
      status: 'conflict'
    }>
  | Readonly<{
      status: 'noop'
    }>
