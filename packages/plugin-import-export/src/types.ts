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
   * Enable to force the export to run synchronously
   */
  disableJobsQueue?: boolean
  /**
   * This function takes the default export collection configured in the plugin and allows you to override it by modifying and returning it
   * @param collection
   * @returns collection
   */
  overrideExportCollection?: (collection: CollectionOverride) => CollectionOverride
}
