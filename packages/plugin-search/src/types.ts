import type { Payload } from 'payload'
import type { CollectionAfterChangeHook, CollectionConfig, PayloadRequest } from 'payload/types'

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
  req: PayloadRequest
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

// Extend the `CollectionAfterChangeHook` with more function args
// Convert the `collection` arg from `SanitizedCollectionConfig` to a string
export type SyncWithSearch = (
  Args: Omit<Parameters<CollectionAfterChangeHook>[0], 'collection'> & {
    collection: string
  },
) => ReturnType<CollectionAfterChangeHook>
