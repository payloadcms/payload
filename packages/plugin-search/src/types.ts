import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Field,
  Locale,
  Payload,
  PayloadRequest,
  StaticLabel,
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
  /**
   * @deprecated
   * This plugin gets the api route from the config directly and does not need to be passed in.
   * As long as you have `routes.api` set in your Payload config, the plugin will use that.
   * This property will be removed in the next major version.
   */
  apiBasePath?: string
  beforeSync?: BeforeSync
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: ((doc: any) => number | Promise<number>) | number
  }
  /**
   * Controls whether drafts are deleted from the search index
   *
   * @default true
   */
  deleteDrafts?: boolean
  localize?: boolean
  /**
   * We use batching when re-indexing large collections. You can control the amount of items per batch, lower numbers should help with memory.
   *
   * @default 50
   */
  reindexBatchSize?: number
  searchOverrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Controls whether drafts are synced to the search index
   *
   * @default false
   */
  syncDrafts?: boolean
}

export type CollectionLabels = {
  [collection: string]: CollectionConfig['labels']
}

export type ResolvedCollectionLabels = {
  [collection: string]: StaticLabel
}

export type SearchPluginConfigWithLocales = {
  labels?: CollectionLabels
  locales?: string[]
} & SearchPluginConfig

export type SanitizedSearchPluginConfig = {
  reindexBatchSize: number
  syncDrafts: boolean
} & SearchPluginConfigWithLocales

export type SyncWithSearchArgs = {
  collection: string
  pluginConfig: SearchPluginConfig
} & Omit<Parameters<CollectionAfterChangeHook>[0], 'collection'>

export type SyncDocArgs = {
  locale?: Locale['code']
  onSyncError?: () => void
} & Omit<SyncWithSearchArgs, 'context' | 'previousDoc'>

// Extend the `CollectionAfterChangeHook` with more function args
// Convert the `collection` arg from `SanitizedCollectionConfig` to a string
export type SyncWithSearch = (Args: SyncWithSearchArgs) => ReturnType<CollectionAfterChangeHook>

export type DeleteFromSearch = (
  Args: {
    pluginConfig: SearchPluginConfig
  } & Parameters<CollectionAfterDeleteHook>[0],
) => ReturnType<CollectionAfterDeleteHook>
