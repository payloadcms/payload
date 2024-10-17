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
  drafts?: boolean | IncomingDrafts
  maxPerDoc?: number
}

export interface SanitizedCollectionVersions extends Omit<IncomingCollectionVersions, 'drafts'> {
  drafts: false | SanitizedDrafts
  maxPerDoc?: number
}

export type IncomingGlobalVersions = {
  drafts?: boolean | IncomingDrafts
  max?: number
}

export type SanitizedGlobalVersions = {
  drafts: false | SanitizedDrafts
  max: number
}

export type TypeWithVersion<T> = {
  createdAt: string
  id: string
  parent: number | string
  publishedLocale?: string
  snapshot?: boolean
  updatedAt: string
  version: T
}
