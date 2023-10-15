import type { Payload } from 'payload'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types'

export interface DocToSync {
  [key: string]: any
  title: string
  doc: {
    relationTo: string
    value: string
  }
}

export type BeforeSync = (args: {
  originalDoc: {
    [key: string]: any
  }
  searchDoc: DocToSync
  payload: Payload
}) => DocToSync | Promise<DocToSync>

export interface SearchConfig {
  searchOverrides?: Partial<CollectionConfig>
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: number | ((doc: any) => number | Promise<number>)
  }
  beforeSync?: BeforeSync
  syncDrafts?: boolean
  deleteDrafts?: boolean
}

// TODO: extend this hook with additional args
// searchConfig: SearchConfig
// collection: string
export type SyncWithSearch = CollectionAfterChangeHook
