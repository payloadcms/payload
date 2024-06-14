import type {
  CollectionAfterChangeHook,
  CollectionConfig,
  Payload,
  PayloadRequestWithData,
} from 'payload'

export type DocToSync = {
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
  req: PayloadRequestWithData
  searchDoc: DocToSync
}) => DocToSync | Promise<DocToSync>

export type SearchPluginConfig = {
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
    pluginConfig: SearchPluginConfig
  },
) => ReturnType<CollectionAfterChangeHook>
