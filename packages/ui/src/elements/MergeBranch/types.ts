export type MergeBranchModalPhase =
  | 'blocked'
  | 'complete'
  | 'merging'
  | 'partial'
  | 'ready'
  | 'scheduling'

export type MergeMode = 'now' | 'schedule'
