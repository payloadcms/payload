import type {
  CollectionConfig,
  Field,
  FileData,
  ImageSize,
  PayloadRequest,
  TypeWithID,
  UploadCollectionSlug,
} from 'payload'

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
}) => Promise<void> | void

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
  collections: Partial<Record<UploadCollectionSlug, CollectionOptions>>
  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean
}
