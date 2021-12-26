export type Autosave = {
  time?: number
}

export type Drafts = {
  autosave?: boolean | Autosave
}

export type IncomingRevisionsType = {
  maxPerDoc?: number
  retainDeleted?: boolean
  drafts?: boolean | Drafts
}

export type TypeWithRevision<T> = {
  id: string
  parent: string | number
  revision: T
}
