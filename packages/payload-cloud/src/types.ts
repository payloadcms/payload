import type {
  CollectionConfig,
  Config,
  FileData,
  PayloadRequest,
  TypeWithID,
  UploadCollectionSlug,
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
  filename: string
  prefix?: string
}) => Promise<string> | string

export type StaticHandler = (
  req: PayloadRequest,
  args: { params: { collection: string; filename: string } },
) => Promise<Response> | Promise<void> | Response | void

export interface PayloadCloudEmailOptions {
  apiKey: string
  config: Config
  defaultDomain: string
  defaultFromAddress?: string
  defaultFromName?: string
  skipVerify?: boolean
}

export interface PluginOptions {
  /**
   * Enable additional debug logging
   *
   * @default false
   */
  debug?: boolean

  /** Payload Cloud Email
   * @default true
   */
  email?:
    | {
        defaultFromAddress: string
        defaultFromName: string
        skipVerify?: boolean
      }
    | false

  /**
   *
   * Configures whether cron jobs defined in config.jobs.autoRun will be run or not
   *
   * @default true
   */
  enableAutoRun?: boolean

  /**
   * Payload Cloud API endpoint
   *
   * @internal Endpoint override for developement
   */
  endpoint?: string

  /** Payload Cloud Storage
   * @default true
   */
  storage?: false

  /**
   * Upload caching. Defaults to 24 hours for all collections.
   *
   * Optionally configure caching per collection
   *
   * ```ts
   * {
   *   collSlug1: {
   *    maxAge: 3600 // Custom value in seconds
   *   },
   *   collSlug2: {
   *     enabled: false // Disable caching for this collection
   *   }
   * }
   * ```
   *
   * @default true
   */

  uploadCaching?:
    | {
        /**
         * Caching configuration per-collection
         */
        collections?: Partial<Record<UploadCollectionSlug, CollectionCachingConfig>>
        /** Caching in seconds override for all collections
         * @default 86400 (24 hours)
         */
        maxAge?: number
      }
    | false
}

export type CollectionCachingConfig = {
  /**
   * Enable/disable caching for this collection
   *
   * @default true
   */
  enabled?: boolean
  /** Caching in seconds override for this collection
   * @default 86400 (24 hours)
   */
  maxAge?: number
}
