import type { CollectionConfig, CollectionSlug, PayloadRequest } from 'payload'

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

export type ExportConfig = {
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

export type ImportConfig = {
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

export type PluginCollectionConfig = {
  /**
   * Override the import collection for this collection or disable it entirely with `false`.
   *
   * @default true
   */
  export?: boolean | ExportConfig
  /**
   * Override the export collection for this collection or disable it entirely with `false`.
   *
   * @default true
   */
  import?: boolean | ImportConfig
  /**
   * Target collection's slug for import/export functionality
   */
  slug: CollectionSlug
}

/**
 * Configuration options for the Import/Export plugin
 */
export type ImportExportPluginConfig = {
  /**
   * Collections to include the Import/Export controls in.
   * If not specified, all collections will have import/export enabled.
   * @default undefined (all collections)
   */
  collections: PluginCollectionConfig[]

  /**
   * Enable debug logging for troubleshooting import/export operations
   * @default false
   */
  debug?: boolean

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
