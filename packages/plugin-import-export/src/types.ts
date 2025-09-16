import type { CollectionAdminOptions, CollectionConfig, UploadConfig } from 'payload'

export type CollectionOverride = {
  admin: CollectionAdminOptions
  upload: UploadConfig
} & CollectionConfig

export type ImportExportPluginConfig = {
  /**
   * Collections to include the Import/Export controls in
   * Defaults to all collections
   */
  collections?: string[]
  /**
   * If true, enables debug logging
   */
  debug?: boolean
  /**
   * If true, disables the download button in the export preview UI
   * @default false
   */
  disableDownload?: boolean
  /**
   * Enable to force the export to run synchronously
   */
  disableJobsQueue?: boolean
  /**
   * If true, disables the save button in the export preview UI
   * @default false
   */
  disableSave?: boolean
  /**
   * Forces a specific export format (`csv` or `json`) and hides the format dropdown from the UI.
   *
   * When defined, this overrides the user's ability to choose a format manually. The export will
   * always use the specified format, and the format selection field will be hidden.
   *
   * If not set, the user can choose between CSV and JSON in the export UI.
   * @default undefined
   */
  format?: 'csv' | 'json'
  /**
   * This function takes the default export collection configured in the plugin and allows you to override it by modifying and returning it
   * @param collection
   * @returns collection
   */
  overrideExportCollection?: (collection: CollectionOverride) => CollectionOverride
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
