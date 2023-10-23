import type { NextFunction, Response } from 'express'
import type { Config } from 'payload/config'
import type { TypeWithID } from 'payload/types'
import type { FileData } from 'payload/types'
import type { CollectionConfig, PayloadRequest } from 'payload/types'

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
  doc: TypeWithID & FileData & TypeWithPrefix
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
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown

export interface PayloadCloudEmailOptions {
  apiKey: string
  config: Config
  defaultDomain: string
}

export interface PluginOptions {
  /** Payload Cloud Email
   * @default true
   */
  email?: false

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
        collections?: Record<string, CollectionCachingConfig>
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
