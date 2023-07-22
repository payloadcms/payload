export type Autosave = {
  interval?: number
}

export type IncomingDrafts = {
  autosave?: boolean | Autosave
}

export type SanitizedDrafts = {
  autosave: false | Autosave
}

export type IncomingCollectionVersions = {
  maxPerDoc?: number
  drafts?: boolean | IncomingDrafts
}

export interface SanitizedCollectionVersions extends Omit<IncomingCollectionVersions, 'drafts'> {
  maxPerDoc?: number
  drafts: SanitizedDrafts | false
}

export type IncomingGlobalVersions = {
  max?: number
  drafts?: boolean | IncomingDrafts
}

export type SanitizedGlobalVersions = {
  max: number
  drafts: SanitizedDrafts | false
}

export type TypeWithVersion<T> = {
  id: string
  parent: string | number
  version: T
  createdAt: string
  updatedAt: string
}
