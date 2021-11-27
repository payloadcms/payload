export type IncomingRevisionsType = {
  maxPerDoc?: number
  retainDeleted?: boolean
}

export type TypeWithRevision<T> = {
  id: string
  parent: string | number
  revision: T
}
