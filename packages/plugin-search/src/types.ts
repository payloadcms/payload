import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Field,
  LabelFunction,
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
  beforeSync?: BeforeSync
  collections?: string[]
  defaultPriorities?: {
    [collection: string]: ((doc: any) => number | Promise<number>) | number
  }
  deleteDrafts?: boolean
  localize?: boolean
  reindexBatchSize?: number
  searchOverrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  syncDrafts?: boolean
}

export type CollectionLabels = {
  [collection: string]: {
    plural?: LabelFunction | StaticLabel
    singular?: LabelFunction | StaticLabel
  }
}

export type SearchPluginConfigWithLocales = {
  labels?: CollectionLabels
  locales?: string[]
} & SearchPluginConfig

export type SyncWithSearchArgs = {
  collection: string
  pluginConfig: SearchPluginConfig
} & Omit<Parameters<CollectionAfterChangeHook>[0], 'collection'>

export type SyncDocArgs = {
  locale?: string
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
