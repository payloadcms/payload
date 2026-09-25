import type {
  CollectionConfig,
  Field,
  FileData,
  FileHandlerOperation,
  ImageSize,
  PayloadHandler,
  PayloadRequest,
  SanitizedCollectionConfig,
  TypeWithID,
  UploadCollectionSlug,
  UploadInstructionsAccess,
  UploadInstructionsCapability,
} from 'payload'

export type { FileHandlerOperation } from 'payload'

export interface File {
  buffer: Buffer
  filename: string
  filesize: number
  mimeType: string
  tempFilePath?: string
  uploadReference?: unknown
}

export type ClientUploadsConfig = { access?: UploadInstructionsAccess } | boolean

/**
 * Reference to a client-uploaded object, returned by an upload handler and
 * submitted with the document. Always carries the signed receipt; `prefix`
 * locates the stored object.
 */
export type UploadReference = {
  _objectKey?: string
  prefix: string
  signedReceipt: `${string}.${string}`
}

export type HandleUpload = (args: {
  collection: CollectionConfig
  data: any
  file: File
  req: PayloadRequest
  /**
   * Pre-resolved storage path (`_objectKey` folded in, contained beneath the collection prefix).
   */
  storageFilePath: string
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
  /**
   * Pre-resolved storage path of the object to delete.
   */
  storageFilePath: string
}) => Promise<void> | void

/** Complete storage keys are resolved before invoking a provider operation. */
export type FileOperationArgs = {
  collection: SanitizedCollectionConfig
  from: string
  mimeType?: string
  req: PayloadRequest
  to: string
}

export type CopyFile = (args: FileOperationArgs) => Promise<void>
export type MoveFile = (args: FileOperationArgs) => Promise<void>

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
    params: {
      collection: string
      filename: string
      operation?: FileHandlerOperation
      prefix?: string
      uploadReference?: unknown
    }
  },
) => Promise<Response> | Response

export interface GeneratedAdapter {
  copyFile: CopyFile
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
  moveFile?: MoveFile
  name: string
  onInit?: () => Promise<void> | void
  staticHandler: StaticHandler
  /** Generates upload instructions when supported. */
  uploadInstructions?: {
    adminHandler?: {
      path: string
      props?: Record<string, unknown>
    }
    enabled: boolean
    endpoint?: {
      handler: PayloadHandler
      path: `/${string}`
    }
  } & UploadInstructionsCapability
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
  collections: Partial<Record<UploadCollectionSlug, CollectionOptions>>
  /**
   * Whether or not to enable the plugin
   *
   * Default: true
   */
  enabled?: boolean
  /**
   * When true (compositional prefixes), the stored `prefix` field is only the
   * document-level segment; the collection prefix comes from plugin options and
   * must not be pre-filled as the field default.
   *
   * Set by storage adapters that support compositional prefixes (e.g. S3, Azure, R2, Vercel Blob, GCS).
   *
   * @default false
   */
  useCompositePrefixes?: boolean
}
