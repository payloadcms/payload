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

export type CronConfig = {
  /**
   * The cron schedule for the job.
   * @default '* * * * *' (every minute).
   *
   * @example
   *     ┌───────────── minute (0 - 59)
   *     │ ┌───────────── hour (0 - 23)
   *     │ │ ┌───────────── day of the month (1 - 31)
   *     │ │ │ ┌───────────── month (1 - 12)
   *     │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
   *     │ │ │ │ │
   *     │ │ │ │ │
   *  - '0 * * * *' every hour at minute 0
   *  - '0 0 * * *' daily at midnight
   *  - '0 0 * * 0' weekly at midnight on Sundays
   *  - '0 0 1 * *' monthly at midnight on the 1st day of the month
   *  - '0/5 * * * *' every 5 minutes
   */
  cron?: string
  /**
   * The limit for the job. This can be overridden by the user. Defaults to 10.
   */
  limit?: number
  /**
   * The queue name for the job.
   */
  queue?: string
}

export interface PluginOptions {
  /**
   * Jobs configuration. By default, there is a single
   * cron job that runs every minute.
   */
  cronJobs?: {
    /**
     * Enable the cron jobs defined in the `run` array,
     * or the default cron job if `run` is not defined.
     * @default true
     * @note If you change this in a development environment,
     * you will need to restart the server for the changes to take effect.
     */
    enabled?: boolean
    /**
     * Cron jobs configuration. If not defined, a single
     * cron job is created that runs every minute.
     */
    run?: CronConfig[]
  }

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
