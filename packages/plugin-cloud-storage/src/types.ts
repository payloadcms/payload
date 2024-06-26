import type {
  CollectionConfig,
  Field,
  FileData,
  ImageSize,
  PayloadRequestWithData,
  TypeWithID,
} from 'payload'

export interface File {
  buffer: Buffer
  filename: string
  filesize: number
  mimeType: string
  tempFilePath?: string
}

export type HandleUpload = (args: {
  collection: CollectionConfig
  data: any
  file: File
  req: PayloadRequestWithData
}) => Promise<void> | void

export interface TypeWithPrefix {
  prefix?: string
}

export type HandleDelete = (args: {
  collection: CollectionConfig
  doc: TypeWithID & FileData & TypeWithPrefix
  filename: string
  req: PayloadRequestWithData
}) => Promise<void> | void

export type GenerateURL = (args: {
  collection: CollectionConfig
  data: any
  filename: string
  prefix?: string
}) => Promise<string> | string

export type StaticHandler = (
  req: PayloadRequestWithData,
  args: { doc?: TypeWithID; params: { collection: string; filename: string } },
) => Promise<Response> | Response

export interface GeneratedAdapter {
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
  collections: Record<string, CollectionOptions>
  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean
}
