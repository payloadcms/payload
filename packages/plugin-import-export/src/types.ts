import type { CollectionConfig, UploadConfig } from 'payload'

export type CollectionOverride = {
  admin: CollectionConfig['admin']
  upload: UploadConfig
} & CollectionConfig

export type ImportExportPluginConfig = {
  /**
   * Collections to include the Import/Export controls in
   * Defaults to all collections
   */
  collections?: string[]
  /**
   * Enable to force the export to run synchronously
   */
  disableJobsQueue?: boolean
  /**
   * Globals to include the Import/Export controls in
   */
  globals?: string[]
  /**
   * This function takes the default export collection configured in the plugin and allows you to override it by modifying and returning it
   * @param collection
   * @returns collection
   */
  overrideExportCollection?: (collection: CollectionOverride) => CollectionOverride
}
