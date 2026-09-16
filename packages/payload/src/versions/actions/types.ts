export type CreateAction = 'publish' | 'saveDraft'

export type UpdateAction = 'publish' | 'saveDraft' | 'unpublish'

export type RestoreAction = 'publish' | 'saveDraft'

export type WriteAction = CreateAction | RestoreAction | UpdateAction

export type WriteOperation = 'create' | 'duplicate' | 'restore' | 'update'

export type ResolveActionArgs = {
  action?: unknown
  autosave?: boolean
  draftsEnabled: boolean
  locale?: null | string
  localizedStatusEnabled?: boolean
  operation: WriteOperation
  status?: unknown
}

export type CanonicalizeWriteStatusArgs<T extends object> = {
  action: undefined | WriteAction
  data: T
  locale?: null | string
}
