import type {
  CollectionAfterChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
  Field,
  Locale,
  Payload,
  PayloadRequest,
  StaticLabel,
} from '@ruya.sa/payload'

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

export type SkipSyncFunction<ConfigTypes = unknown> = (args: {
  collectionSlug: string
  doc: any
  locale: ConfigTypes extends { locale: unknown } ? ConfigTypes['locale'] : string | undefined
  req: PayloadRequest
}) => boolean | Promise<boolean>

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
  localize?: boolean
  /**
   * We use batching when re-indexing large collections. You can control the amount of items per batch, lower numbers should help with memory.
   *
   * @default 50
   */
  reindexBatchSize?: number
  searchOverrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Determine whether to skip syncing a document for a specific locale.
   * Useful for multi-tenant applications, conditional indexing, or any scenario where
   * sync behavior should vary by locale, document, or other factors.
   *
   * @default undefined - All configured locales will be synced
   *
   * @example
   * // Skip syncing based on document's tenant settings
   * skipSync: async ({ locale, req, doc, collectionSlug }) => {
   *   // For non-localized collections, locale will be undefined
   *   if (!locale) return false
   *
   *   const tenant = await req.payload.findByID({
   *     collection: 'tenants',
   *     id: doc.tenant.id
   *   })
   *   return !tenant.allowedLocales.includes(locale)
   * }
   */
  skipSync?: SkipSyncFunction<ConfigTypes>
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
