import type {
  CollectionConfig,
  CollectionSlug,
  DataFromCollectionSlug,
  PayloadRequest,
} from 'payload'

/**
 * Function to dynamically determine the limit based on request context
 */
export type LimitFunction = (args: { req: PayloadRequest }) => number | Promise<number>

/**
 * Limit configuration - either a hard number or a function.
 * Set to 0 for unlimited (no restriction). Default is 0.
 */
export type Limit = LimitFunction | number

/**
 * Type for overriding import/export collection configurations
 */
export type CollectionOverride = ({
  collection,
}: {
  collection: CollectionConfig
}) => CollectionConfig | Promise<CollectionConfig>

/**
 * Result of a completed import operation (or a single batch within one)
 */
export type ImportResult = {
  errors: Array<{
    doc: Record<string, unknown>
    error: string
    index: number
  }>
  imported: number
  total: number
  updated: number
}

/**
 * Hook called before each export batch is written to file.
 * Receives the transformed batch data and the original DB documents.
 * Return the modified data array — it replaces `data` for the write step.
 */
export type ExportBeforeHook<TSlug extends CollectionSlug = CollectionSlug> = (args: {
  /** Current batch number, starting at 1 */
  batchNumber: number
  /** Transformed batch — flat rows for CSV, nested docs for JSON. Modify and return this. */
  data: Record<string, unknown>[]
  /** Export format. Open-ended to support custom formats in the future. */
  format: 'csv' | 'json' | (string & {})
  /**
   * Raw DB documents before format-specific transformation. Read-only reference.
   *
   * Typed as a union so call sites that don't know the collection slug at
   * compile time (e.g. job tasks) don't need `as any` casts. To get the
   * narrower typed shape, declare your hook with a slug:
   * `const hook: ExportBeforeHook<'posts'> = (args) => { ... }`.
   */
  originalData: DataFromCollectionSlug<TSlug>[] | Record<string, unknown>[]
  req: PayloadRequest
  /** Total number of batches for this export operation */
  totalBatches: number
}) => Promise<Record<string, unknown>[]> | Record<string, unknown>[]

/**
 * Hook called after each export batch has been written to file.
 * For logging and observability only — return value is ignored.
 */
export type ExportAfterHook = (args: {
  /** Current batch number, starting at 1 */
  batchNumber: number
  /** The batch data that was written */
  data: Record<string, unknown>[]
  /** Export format */
  format: 'csv' | 'json' | (string & {})
  /** Raw DB documents before transformation */
  originalData: Record<string, unknown>[]
  req: PayloadRequest
  /** Total number of batches for this export operation */
  totalBatches: number
}) => Promise<void> | void

/**
 * Hook called before each import batch is written to the database.
 * Receives the processed (unflattened) documents and the raw file rows.
 * Return the modified documents array — it replaces `data` for the DB write step.
 */
export type ImportBeforeHook<TSlug extends CollectionSlug = CollectionSlug> = (args: {
  /** Current batch number, starting at 1 */
  batchNumber: number
  /**
   * Unflattened documents ready to be written to the database. Modify and
   * return this. Typed as `Partial<...>` because rows from a CSV or JSON
   * import are not guaranteed to include every required field of the
   * collection — required fields are validated at write time.
   */
  data: Partial<DataFromCollectionSlug<TSlug>>[]
  /** Import format. Open-ended to support custom formats in the future. */
  format: 'csv' | 'json' | (string & {})
  /** Raw parsed file rows before unflattening. Read-only reference. */
  originalData: Record<string, unknown>[]
  req: PayloadRequest
  /** Total number of batches for this import operation */
  totalBatches: number
}) => Partial<DataFromCollectionSlug<TSlug>>[] | Promise<Partial<DataFromCollectionSlug<TSlug>>[]>

/**
 * Hook called after each import batch has been written to the database.
 * For logging and observability only — return value is ignored.
 */
export type ImportAfterHook = (args: {
  /** Current batch number, starting at 1 */
  batchNumber: number
  /** Import format */
  format: 'csv' | 'json' | (string & {})
  /**
   * Raw parsed file rows for this batch before unflattening and before-hook
   * transformation. For CSV this is the flat key/value row; for JSON this is
   * the top-level parsed document. Read-only reference.
   */
  originalData: Record<string, unknown>[]
  req: PayloadRequest
  /** Result of this batch — counts and errors. Not the cumulative total. */
  result: ImportResult
  /** Total number of batches for this import operation */
  totalBatches: number
}) => Promise<void> | void

/**
 * Per-collection export configuration. Set on each entry of
 * ```
 * importExportPlugin({ collections: [{ slug, export: { ... } }] })
 * ```
 */
export type ExportConfig<TSlug extends CollectionSlug = CollectionSlug> = {
  /**
   * Number of documents to process in each batch during export. This config is applied to both jobs and synchronous exports.
   *
   * @default 100
   */
  batchSize?: number
  /**
   * If true, disables the download button in the export preview UI
   * @default false
   */
  disableDownload?: boolean
  /**
   * If true, disables the jobs queue for exports and runs them synchronously.
   * @default false
   */
  disableJobsQueue?: boolean
  /**
   * If true, disables the save button in the export preview UI
   * @default false
   */
  disableSave?: boolean
  /**
   * Forces a specific export format (`csv` or `json`) and hides the format dropdown from the UI.
   * When defined, this overrides the user's ability to choose a format manually.
   * If not set, the user can choose between CSV and JSON in the export UI.
   * @default undefined
   */
  format?: 'csv' | 'json'
  /**
   * Lifecycle hooks for export operations on this collection.
   * Hooks fire once per batch.
   */
  hooks?: {
    /**
     * Called after each batch is written to file. For logging/observability only.
     * Return value is ignored.
     */
    after?: ExportAfterHook
    /**
     * Called before each batch is written to file.
     * Return value replaces the batch data for the write step.
     */
    before?: ExportBeforeHook<TSlug>
  }
  /**
   * Maximum number of documents that can be exported in a single operation.
   * Can be a number or a function that returns a number based on request context.
   * Set to 0 for unlimited (default). Overrides the global exportLimit if set.
   */
  limit?: Limit
  /**
   * Override the export collection for this collection.
   *
   * @default true
   */
  overrideCollection?: CollectionOverride
}

/**
 * Per-collection import configuration. Set on each entry of
 * ```
 * importExportPlugin({ collections: [{ slug, import: { ... } }] })
 * ```
 */
export type ImportConfig<TSlug extends CollectionSlug = CollectionSlug> = {
  /**
   * Number of documents to process in each batch during import. This config is applied to both jobs and synchronous imports.
   *
   * @default 100
   */
  batchSize?: number
  /**
   * Default version status for imported documents when _status field is not provided.
   * Only applies to collections with versions enabled.
   * @default 'published'
   */
  defaultVersionStatus?: 'draft' | 'published'
  /**
   * If true, disables the jobs queue for imports and runs them synchronously.
   * @default false
   */
  disableJobsQueue?: boolean
  /**
   * Lifecycle hooks for import operations on this collection.
   * Hooks fire once per batch.
   */
  hooks?: {
    /**
     * Called after each batch is written to the database. For logging/observability only.
     * Return value is ignored.
     */
    after?: ImportAfterHook
    /**
     * Called before each batch is written to the database.
     * Return value replaces the batch data for the DB write step.
     */
    before?: ImportBeforeHook<TSlug>
  }
  /**
   * Maximum number of documents that can be imported in a single operation.
   * Can be a number or a function that returns a number based on request context.
   * Set to 0 for unlimited (default). Overrides the global importLimit if set.
   */
  limit?: Limit
  /**
   * Override the import collection for this collection.
   *
   * @default true
   */
  overrideCollection?: CollectionOverride
}

/**
 * Per-collection plugin entry. Identifies a target collection by `slug` and
 * configures its export/import behavior; either side can be disabled with `false`.
 */
export type PluginCollectionConfig<TSlug extends CollectionSlug = CollectionSlug> = {
  /**
   * Override the import collection for this collection or disable it entirely with `false`.
   *
   * @default true
   */
  export?: boolean | ExportConfig<TSlug>
  /**
   * Override the export collection for this collection or disable it entirely with `false`.
   *
   * @default true
   */
  import?: boolean | ImportConfig<TSlug>
  /**
   * Target collection's slug for import/export functionality
   */
  slug: TSlug
}

/**
 * Configuration options for the Import/Export plugin
 */
export type ImportExportPluginConfig = {
  /**
   * Global default batch size for both import and export operations.
   * Can be overridden at the collection level via `export.batchSize` or `import.batchSize`.
   * @default 100
   */
  batchSize?: number

  /**
   * Collections to include the Import/Export controls in.
   * If not specified, all collections will have import/export enabled.
   * @default undefined (all collections)
   */
  collections: PluginCollectionConfig<CollectionSlug>[]

  /**
   * Enable debug logging for troubleshooting import/export operations
   * @default false
   */
  debug?: boolean

  /**
   * Global default version status for imported documents when _status field is not provided.
   * Only applies to collections with versions enabled.
   * Can be overridden at the collection level via `import.defaultVersionStatus`.
   * @default 'published'
   */
  defaultVersionStatus?: 'draft' | 'published'

  /**
   * Global maximum for export operations.
   * Can be a number or a function that returns a number based on request context.
   * Set to 0 for unlimited (default). Per-collection limits take precedence.
   */
  exportLimit?: Limit

  /**
   * Global maximum for import operations.
   * Can be a number or a function that returns a number based on request context.
   * Set to 0 for unlimited (default). Per-collection limits take precedence.
   */
  importLimit?: Limit

  /**
   * Function to override the default export collection configuration.
   * Takes the default export collection and allows you to modify and return it.
   * Useful for adding access control, changing upload directory, etc.
   *
   * This can also be set at the collection level via `export` config.
   */
  overrideExportCollection?: CollectionOverride

  /**
   * Function to override the default import collection configuration.
   * Takes the default import collection and allows you to modify and return it.
   * Useful for adding access control, changing upload directory, etc.
   *
   * This can also be set at the collection level via `import` config.
   */
  overrideImportCollection?: CollectionOverride
}

/**
 * Field-level hook that runs before a field value is exported. Works for both
 * CSV and JSON. Return a value to replace the field, or `undefined` to fall
 * back to default behavior. Mutate `siblingData` to add or remove columns at
 * the same level.
 *
 * Return `null` (CSV only) when the hook has already written its replacement
 * columns to `siblingData` and default flattening should be skipped — used by
 * built-in handlers for polymorphic relationships to avoid duplicate columns.
 */
export type FieldBeforeExportHook = (args: {
  /** Runtime column path, underscore-separated (includes array indices, e.g. `items_0_note`). */
  columnName: string
  /** The top-level document being exported. */
  data: Record<string, unknown>
  format: 'csv' | 'json' | (string & {})
  /** Writable output at the current level. CSV: the flat row accumulator. JSON: the sibling output object. */
  siblingData: Record<string, unknown>
  /** Read-only source at the current level, before any transformation. */
  siblingDoc: Record<string, unknown>
  value: unknown
}) => unknown

/**
 * Field-level hook that runs before a field value is imported. Works for both
 * CSV and JSON. Return the transformed value to use for this field.
 */
export type FieldBeforeImportHook = (args: {
  columnName: string
  /** Full flat row (CSV) or top-level parsed document (JSON). */
  data: Record<string, unknown>
  format: 'csv' | 'json' | (string & {})
  /** Data at the current level. CSV: same reference as `data`. JSON: the parent-level object. */
  siblingData: Record<string, unknown>
  /** Read-only source at the current level, before any transformation. CSV: same as `data`. */
  siblingDoc: Record<string, unknown>
  value: unknown
}) => unknown

/** @internal */
export type ExportFieldHookEntry = { fn: FieldBeforeExportHook; type: 'beforeExport' }

/** @internal */
export type ImportFieldHookEntry = { fn: FieldBeforeImportHook; type: 'beforeImport' }

/**
 * Base pagination data returned from preview endpoints
 */
export type PreviewPaginationData = {
  /**
   * Whether there is a next page available
   */
  hasNextPage: boolean
  /**
   * Whether there is a previous page available
   */
  hasPrevPage: boolean
  /**
   * Number of documents per page
   */
  limit: number
  /**
   * The resolved max limit value (max documents allowed), if any
   */
  maxLimit?: number
  /**
   * Current page number (1-indexed)
   */
  page: number
  /**
   * Total number of documents
   */
  totalDocs: number
  /**
   * Total number of pages
   */
  totalPages: number
}

/**
 * Response from export preview endpoint
 */
export type ExportPreviewResponse = PreviewPaginationData & {
  /**
   * Column names for CSV format (undefined for JSON)
   */
  columns?: string[]
  /**
   * Preview documents (transformed for display)
   */
  docs: Record<string, unknown>[]
  /**
   * Actual count of docs that will be exported (respects export limit)
   */
  exportTotalDocs: number
}

/**
 * Response from import preview endpoint
 */
export type ImportPreviewResponse = PreviewPaginationData & {
  /**
   * Preview documents parsed from the import file
   */
  docs: Record<string, unknown>[]
  /**
   * Whether the file exceeds the max limit
   */
  limitExceeded?: boolean
}
