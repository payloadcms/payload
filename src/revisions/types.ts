export type Autosave = {
  interval?: number
}

export type Drafts = {
  autosave?: boolean | Autosave
}

export type IncomingCollectionRevisionsType = {
  maxPerDoc?: number
  retainDeleted?: boolean
  drafts?: boolean | Drafts
}

export type IncomingGlobalRevisionsType = {
  max?: number
  drafts?: boolean | Drafts
}

export type TypeWithRevision<T> = {
  id: string
  parent: string | number
  revision: T
}
