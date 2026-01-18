import type {
  CollectionConfig,
  Field,
  FileData,
  ImageSize,
  PayloadRequest,
  TypeWithID,
  UploadCollectionSlug,
} from '@ruya.sa/payload'

export interface File {
  buffer: Buffer
  clientUploadContext?: unknown
  filename: string
  filesize: number
  mimeType: string
  tempFilePath?: string
}

export type ClientUploadsAccess = (args: {
  collectionSlug: UploadCollectionSlug
  req: PayloadRequest
}) => boolean | Promise<boolean>

export type ClientUploadsConfig =
  | {
      access?: ClientUploadsAccess
    }
  | boolean

export type HandleUpload = (args: {
  clientUploadContext: unknown
  collection: CollectionConfig
  data: any
  file: File
  req: PayloadRequest
}) =>
  | Partial<FileData & TypeWithID>
  | Promise<Partial<FileData & TypeWithID>>
  | Promise<void>
  | void

export interface TypeWithPrefix {
  prefix?: string
}

export type HandleDelete = (args: {
  collection: CollectionConfig
  doc: FileData & TypeWithID & TypeWithPrefix
  filename: string
  req: PayloadRequest
}) => Promise<void> | void

export type GenerateURL = (args: {
  collection: CollectionConfig
  data: any
  filename: string
  prefix?: string
}) => Promise<string> | string

export type StaticHandler = (
  req: PayloadRequest,
  args: {
    doc?: TypeWithID
    headers?: Headers
    params: { clientUploadContext?: unknown; collection: string; filename: string }
  },
) => Promise<Response> | Response

export interface GeneratedAdapter {
  clientUploads?: ClientUploadsConfig
  /**
   * Additional fields to be injected into the base collection and image sizes
   */
  fields?: Field[]
  /**
   * Generates the public URL for a file
   */
  generateURL?: GenerateURL
  handleDelete: HandleDelete
  handleUpload: HandleUpload
  name: string
  onInit?: () => void
  staticHandler: StaticHandler
}

export type Adapter = (args: { collection: CollectionConfig; prefix?: string }) => GeneratedAdapter

export type AllowList = Array<{
  hostname: string
  pathname?: string
  port?: string
  protocol?: 'http' | 'https'
  search?: string
}>

export type GenerateFileURL = (args: {
  collection: CollectionConfig
  filename: string
  prefix?: string
  size?: ImageSize
}) => Promise<string> | string

export interface CollectionOptions {
  adapter: Adapter | null
  disableLocalStorage?: boolean
  disablePayloadAccessControl?: true
  generateFileURL?: GenerateFileURL
  prefix?: string
}

export interface PluginOptions {
  /**
   * When enabled, fields (like the prefix field) will always be inserted into
   * the collection schema regardless of whether the plugin is enabled. This
   * ensures a consistent schema across all environments.
   *
   * This will be enabled by default in Payload v4.
   *
   * @default false
   */
  alwaysInsertFields?: boolean
  collections: Partial<Record<UploadCollectionSlug, CollectionOptions>>
  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean
}
