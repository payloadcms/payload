export type Breadcrumb = {
  doc: string
  label: string
  url?: string
}

export type GenerateURL = (
  docs: Array<Record<string, unknown>>,
  currentDoc: Record<string, unknown>,
) => string

export type GenerateLabel = (
  docs: Array<Record<string, unknown>>,
  currentDoc: Record<string, unknown>,
) => string

export type NestedDocsPluginConfig = {
  /**
   * Should be supplied if using an alternative field name for the 'breadcrumbs' field in collections
   */
  breadcrumbsFieldSlug?: string
  /**
   * The slugs of the collections this plugin should extend. If you need different configs for different collections, this plugin can be added to your config more than once having different collections.
   */
  collections: string[]
  generateLabel?: GenerateLabel
  generateURL?: GenerateURL
  /**
   * Should be supplied if using an alternative field name for the 'parent' field in collections
   */
  parentFieldSlug?: string
  /**
   * Needs to be set if you want to add a path field to your collection.
   * If not supplied, the path field will not be added. False by default which means disabled by default.
   */
  pathFieldSlug?: false | string
  /**
   * Collections that the path field should be unique across. If not supplied, the path field will be
   * unique across the collections that the plugin is added to.
   */
  uniquePathCollections?: string[]
}
