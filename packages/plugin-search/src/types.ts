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
  collectionSlug: string
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
  searchOverrides?: Partial<Omit<CollectionConfig, 'fields'>> & { fields?: FieldsOverride }
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

export type SearchPluginConfigWithLocales<ConfigTypes = unknown> =
  SearchPluginConfig<ConfigTypes> & {
    labels?: CollectionLabels
  }

export type SanitizedSearchPluginConfig<ConfigTypes = unknown> =
  SearchPluginConfigWithLocales<ConfigTypes> & {
    reindexBatchSize: number
    syncDrafts: boolean
  }

export type SyncWithSearchArgs = Omit<Parameters<CollectionAfterChangeHook>[0], 'collection'> & {
  collection: string
  pluginConfig: SanitizedSearchPluginConfig
}

export type SyncDocArgs = Omit<SyncWithSearchArgs, 'context' | 'previousDoc'> & {
  locale?: Locale['code']
  onSyncError?: () => void
}

// Extend the `CollectionAfterChangeHook` with more function args
// Convert the `collection` arg from `SanitizedCollectionConfig` to a string
export type SyncWithSearch = (Args: SyncWithSearchArgs) => ReturnType<CollectionAfterChangeHook>

export type DeleteFromSearch = (args: SearchPluginConfig) => CollectionBeforeDeleteHook
