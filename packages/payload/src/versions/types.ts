export type Autosave = {
  interval?: number
}

export type IncomingDrafts = {
  autosave?: Autosave | boolean
  validate?: boolean
}

export type SanitizedDrafts = {
  autosave: Autosave | false
  validate: boolean
}

export type IncomingCollectionVersions = {
  drafts?: IncomingDrafts | boolean
  maxPerDoc?: number
}

export interface SanitizedCollectionVersions extends Omit<IncomingCollectionVersions, 'drafts'> {
  drafts: SanitizedDrafts | false
  maxPerDoc?: number
}

export type IncomingGlobalVersions = {
  drafts?: IncomingDrafts | boolean
  max?: number
}

export type SanitizedGlobalVersions = {
  drafts: SanitizedDrafts | false
  max: number
}

export type TypeWithVersion<T> = {
  createdAt: string
  id: string
  parent: number | string
  updatedAt: string
  version: T
}
