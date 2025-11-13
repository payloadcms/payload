import type { CollectionAdminOptions, CollectionConfig, UploadConfig } from 'payload'

/**
 * Type for overriding import/export collection configurations
 */
export type CollectionOverride = {
  admin: CollectionAdminOptions
  upload: UploadConfig
} & CollectionConfig

/**
 * Configuration options for the Import/Export plugin
 */
export type ImportExportPluginConfig = {
  /**
   * Number of documents to process in each batch during import
   * @default 100
   */
  batchSize?: number

  /**
   * Collections to include the Import/Export controls in.
   * If not specified, all collections will have import/export enabled.
   * @default undefined (all collections)
   */
  collections?: string[]

  /**
   * Enable debug logging for troubleshooting import/export operations
   * @default false
   */
  debug?: boolean

  /**
   * Default version status for imported documents when _status field is not provided.
   * Only applies to collections with versions enabled.
   * @default 'published'
   */
  defaultVersionStatus?: 'draft' | 'published'

  /**
   * If true, disables the download button in the export preview UI
   * @default false
   */
  disableDownload?: boolean

  /**
   * If true, forces exports and imports to run synchronously instead of using the jobs queue.
   * Useful for simpler setups or when the jobs queue is not configured.
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
   * Override the default export collection configuration.
   * This function receives the default collection config and should return the modified config.
   */
  overrideExportCollection?: (collection: CollectionOverride) => CollectionOverride

  /**
   * Override the default import collection configuration.
   * This function receives the default collection config and should return the modified config.
   */
  overrideImportCollection?: (collection: CollectionOverride) => CollectionOverride
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
