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
  format: 'csv' | 'json' | ({} & string)
  /** Raw DB documents before format-specific transformation. Read-only reference. */
  originalData: DataFromCollectionSlug<TSlug>[]
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
  format: 'csv' | 'json' | ({} & string)
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
  /** Unflattened documents ready to be written to the database. Modify and return this. */
  data: DataFromCollectionSlug<TSlug>[]
  /** Import format. Open-ended to support custom formats in the future. */
  format: 'csv' | 'json' | ({} & string)
  /** Raw parsed file rows before unflattening. Read-only reference. */
  originalData: Record<string, unknown>[]
  req: PayloadRequest
  /** Total number of batches for this import operation */
  totalBatches: number
}) => DataFromCollectionSlug<TSlug>[] | Promise<DataFromCollectionSlug<TSlug>[]>

/**
 * Hook called after each import batch has been written to the database.
 * For logging and observability only — return value is ignored.
 */
export type ImportAfterHook = (args: {
  /** Current batch number, starting at 1 */
  batchNumber: number
  /** Import format */
  format: 'csv' | 'json' | ({} & string)
  req: PayloadRequest
  /** Result of this batch — counts and errors. Not the cumulative total. */
  result: ImportResult
  /** Total number of batches for this import operation */
  totalBatches: number
}) => Promise<void> | void

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
 * Custom function used to modify the outgoing csv data by manipulating the data, siblingData or by returning the desired value
 * @deprecated since v4 — use collection-level `export.hooks.before` instead.
 * Still functional, but will be removed in a future major version.
 */
export type ToCSVFunction = (args: {
  /**
   * The path of the column for the field, for arrays this includes the index (zero-based)
   */
  columnName: string
  /**
   * Alias for `row`, the object that accumulates CSV output.
   * Use this to write additional fields into the exported row.
   */
  data: Record<string, unknown>
  /**
   * The top level document
   */
  doc: Document
  /**
   * The object data that can be manipulated to assign data to the CSV
   */
  row: Record<string, unknown>
  /**
   * The document data at the level where it belongs
   */
  siblingDoc: Record<string, unknown>
  /**
   * The data for the field.
   */
  value: unknown
}) => unknown

/**
 * Custom function used to transform incoming CSV data during import
 * @deprecated since v4 — use collection-level `import.hooks.before` instead.
 * Still functional, but will be removed in a future major version.
 */
export type FromCSVFunction = (args: {
  /**
   * The path of the column for the field
   */
  columnName: string
  /**
   * The current row data being processed
   */
  data: Record<string, unknown>
  /**
   * The value being imported for this field
   */
  value: unknown
}) => unknown

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
export type ExportPreviewResponse = {
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
} & PreviewPaginationData

/**
 * Response from import preview endpoint
 */
export type ImportPreviewResponse = {
  /**
   * Preview documents parsed from the import file
   */
  docs: Record<string, unknown>[]
  /**
   * Whether the file exceeds the max limit
   */
  limitExceeded?: boolean
} & PreviewPaginationData
