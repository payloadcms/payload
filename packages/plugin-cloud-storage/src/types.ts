import type { NextFunction, Response } from 'express'
import type { FileData, ImageSize } from 'payload/types'
import type { TypeWithID } from 'payload/types'
import type { CollectionConfig, PayloadRequest } from 'payload/types'
import type { Configuration as WebpackConfig } from 'webpack'

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

export interface GeneratedAdapter {
  generateURL: GenerateURL
  handleDelete: HandleDelete
  handleUpload: HandleUpload
  onInit?: () => void
  staticHandler: StaticHandler
  webpack?: (config: WebpackConfig) => WebpackConfig
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
