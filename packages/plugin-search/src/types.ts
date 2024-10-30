import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Field,
  Payload,
  PayloadRequest,
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
  req: PayloadRequest
  searchDoc: DocToSync
}) => DocToSync | Promise<DocToSync>

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type SearchPluginConfig = {
  beforeSync?: BeforeSync
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: ((doc: any) => number | Promise<number>) | number
  }
  deleteDrafts?: boolean
  localize?: boolean
  searchOverrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  syncDrafts?: boolean
}

// Extend the `CollectionAfterChangeHook` with more function args
// Convert the `collection` arg from `SanitizedCollectionConfig` to a string
export type SyncWithSearch = (
  Args: {
    collection: string
    pluginConfig: SearchPluginConfig
  } & Omit<Parameters<CollectionAfterChangeHook>[0], 'collection'>,
) => ReturnType<CollectionAfterChangeHook>

export type DeleteFromSearch = (
  Args: {
    pluginConfig: SearchPluginConfig
  } & Omit<Parameters<CollectionAfterDeleteHook>[0], 'collection'>,
) => ReturnType<CollectionAfterDeleteHook>
