import type { CollectionSlug, PayloadRequest, SanitizedCollectionConfig } from 'payload'

export type Breadcrumb = {
  doc: string
  label: string
  /** The slugs of the doc and its parents joined with `/`, such as `/parent/child`. */
  path?: string
  url?: string
}

export type GenerateURL = (
  docs: Array<Record<string, unknown>>,
  currentDoc: Record<string, unknown>,
  collection: SanitizedCollectionConfig,
  req: PayloadRequest,
) => string

export type GenerateLabel = (
  docs: Array<Record<string, unknown>>,
  currentDoc: Record<string, unknown>,
  collection: SanitizedCollectionConfig,
  req: PayloadRequest,
) => string

export type NestedDocsPluginConfig = {
  /**
   * Should be supplied if using an alternative field name for the 'breadcrumbs' field in collections
   */
  breadcrumbsFieldSlug?: string
  /**
   * The slugs of the collections this plugin should extend. If you need different configs for different collections, this plugin can be added to your config more than once having different collections.
   */
  collections: CollectionSlug[]
  generateLabel?: GenerateLabel
  /**
   * Generates the `url` of each breadcrumb. Defaults to the `generateFrontendPath` of the collection,
   * which receives the doc with its computed breadcrumbs, so it can return `doc.breadcrumbs.at(-1).path`.
   *
   * @deprecated Add `generateFrontendPath` to your collections instead. Will be removed in v5.
   */
  generateURL?: GenerateURL
  /**
   * Should be supplied if using an alternative field name for the 'parent' field in collections
   */
  parentFieldSlug?: string
  /**
   * The field whose values are joined to build the `path` of each breadcrumb
   * @default 'slug'
   */
  slugFieldSlug?: string
}
