import type {
  CollectionAfterChangeHook,
  CollectionBeforeDeleteHook,
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

export type FilterLocalesToSyncFunction<ConfigTypes = unknown> = (args: {
  collectionSlug: string
  doc: any
  localeCodes: ConfigTypes extends { locale: unknown } ? ConfigTypes['locale'][] : string[]
  req: PayloadRequest
}) =>
  | (ConfigTypes extends { locale: unknown } ? ConfigTypes['locale'][] : string[])
  | Promise<ConfigTypes extends { locale: unknown } ? ConfigTypes['locale'][] : string[]>

export type SearchPluginConfig<ConfigTypes = unknown> = {
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
  /**
   * Filter which locales should be synced to the search index.
   * Useful for multi-tenant applications where each tenant uses different languages.
   *
   * @default undefined - All configured locales will be synced
   *
   * @example
   * // Filter based on document's tenant
   * filterLocalesToSync: async ({ localeCodes, req, doc, collectionSlug }) => {
   *   const tenant = await req.payload.findByID({
   *     collection: 'tenants',
   *     id: doc.tenant.id
   *   })
   *   return localeCodes.filter(code => tenant.allowedLocales.includes(code))
   * }
   */
  filterLocalesToSync?: FilterLocalesToSyncFunction<ConfigTypes>
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

export type SearchPluginConfigWithLocales<ConfigTypes = unknown> = {
  labels?: CollectionLabels
} & SearchPluginConfig<ConfigTypes>

export type SanitizedSearchPluginConfig<ConfigTypes = unknown> = {
  reindexBatchSize: number
  syncDrafts: boolean
} & SearchPluginConfigWithLocales<ConfigTypes>

export type SyncWithSearchArgs = {
  collection: string
  pluginConfig: SanitizedSearchPluginConfig
} & Omit<Parameters<CollectionAfterChangeHook>[0], 'collection'>

export type SyncDocArgs = {
  locale?: Locale['code']
  onSyncError?: () => void
} & Omit<SyncWithSearchArgs, 'context' | 'previousDoc'>

// Extend the `CollectionAfterChangeHook` with more function args
// Convert the `collection` arg from `SanitizedCollectionConfig` to a string
export type SyncWithSearch = (Args: SyncWithSearchArgs) => ReturnType<CollectionAfterChangeHook>

export type DeleteFromSearch = (args: SearchPluginConfig) => CollectionBeforeDeleteHook
