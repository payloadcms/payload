import type { DocumentInfoContext } from '@payloadcms/ui'
import type {
  CollectionConfig,
  CollectionSlug,
  Field,
  GlobalConfig,
  GlobalSlug,
  PayloadRequest,
  UploadCollectionSlug,
} from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type PartialDocumentInfoContext = Pick<
  DocumentInfoContext,
  | 'collectionSlug'
  | 'docPermissions'
  | 'globalSlug'
  | 'hasPublishedDoc'
  | 'hasPublishPermission'
  | 'hasSavePermission'
  | 'id'
  | 'initialData'
  | 'initialState'
  | 'preferencesKey'
  | 'title'
  | 'versionCount'
>

export type GenerateTitle<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateDescription<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateImage<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateURL<T = any> = (
  args: {
    collectionConfig?: CollectionConfig
    doc: T
    globalConfig?: GlobalConfig
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type SEOPluginConfig = {
  /**
   * Collections to include the SEO fields in
   */
  collections?: ({} | CollectionSlug)[]
  /**
   * Override the default fields inserted by the SEO plugin via a function that receives the default fields and returns the new fields
   *
   * If you need more flexibility you can insert the fields manually as needed. @link https://payloadcms.com/docs/plugins/seo#direct-use-of-fields
   */
  fields?: FieldsOverride
  generateDescription?: GenerateDescription
  generateImage?: GenerateImage
  generateTitle?: GenerateTitle
  /**
   *
   */
  generateURL?: GenerateURL
  /**
   * Globals to include the SEO fields in
   */
  globals?: ({} | GlobalSlug)[]
  interfaceName?: string
  /**
   * Group fields into tabs, your content will be automatically put into a general tab and the SEO fields into an SEO tab
   *
   * If you need more flexibility you can insert the fields manually as needed. @link https://payloadcms.com/docs/plugins/seo#direct-use-of-fields
   */
  tabbedUI?: boolean
  /**
   * The slug of the collection used to handle image uploads
   */
  uploadsCollection?: {} | UploadCollectionSlug
}

export type Meta = {
  description?: string
  image?: any // TODO: type this
  keywords?: string
  title?: string
}
