import type { Payload } from 'payload'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types'

export interface DocToSync {
  [key: string]: any
  doc: {
    relationTo: string
    value: string
  }
  title: string
}

export type BeforeSync = (args: {
  originalDoc: {
    [key: string]: any
  }
  payload: Payload
  searchDoc: DocToSync
}) => DocToSync | Promise<DocToSync>

export interface SearchConfig {
  beforeSync?: BeforeSync
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: ((doc: any) => Promise<number> | number) | number
  }
  deleteDrafts?: boolean
  searchOverrides?: Partial<CollectionConfig>
  syncDrafts?: boolean
}

// TODO: extend this hook with additional args
// searchConfig: SearchConfig
// collection: string
export type SyncWithSearch = CollectionAfterChangeHook
