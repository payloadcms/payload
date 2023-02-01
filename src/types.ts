import type { NextFunction, Response } from 'express'
import type { TypeWithID } from 'payload/dist/collections/config/types'
import type { FileData, ImageSize } from 'payload/dist/uploads/types'
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
  req: PayloadRequest
  data: any
  file: File
}) => Promise<void> | void

export interface TypeWithPrefix {
  prefix?: string
}

export type HandleDelete = (args: {
  collection: CollectionConfig
  req: PayloadRequest
  doc: TypeWithID & FileData & TypeWithPrefix
  filename: string
}) => Promise<void> | void

export type GenerateURL = (args: {
  filename: string
  collection: CollectionConfig
  prefix?: string
}) => string | Promise<string>

export type StaticHandler = (
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown

export interface GeneratedAdapter {
  handleUpload: HandleUpload
  handleDelete: HandleDelete
  generateURL: GenerateURL
  staticHandler: StaticHandler
  webpack?: (config: WebpackConfig) => WebpackConfig
  onInit?: () => void
}

export type Adapter = (args: { collection: CollectionConfig; prefix?: string }) => GeneratedAdapter

export type GenerateFileURL = (args: {
  collection: CollectionConfig
  filename: string
  prefix?: string
  size?: ImageSize
}) => Promise<string> | string

export interface CollectionOptions {
  disableLocalStorage?: boolean
  disablePayloadAccessControl?: true
  generateFileURL?: GenerateFileURL
  prefix?: string
  adapter: Adapter | null
}

export interface PluginOptions {
  collections: Record<string, CollectionOptions>
}
