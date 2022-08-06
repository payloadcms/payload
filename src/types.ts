import type { TypeWithID } from 'payload/dist/collections/config/types'
import type { FileData } from 'payload/dist/uploads/types'
import type { CollectionConfig, PayloadRequest } from 'payload/types'
import type { Configuration as WebpackConfig } from 'webpack'

export interface File {
  buffer: Buffer
  filename: string
  mimeType: string
}

export type HandleUpload = (args: {
  collection: CollectionConfig
  req: PayloadRequest
  data: any
  file: File
}) => Promise<void> | void

export type HandleDelete = (args: {
  collection: CollectionConfig
  req: PayloadRequest
  doc: TypeWithID & FileData
}) => Promise<void> | void

export type GenerateURL = (args: {
  filename: string
  collection: CollectionConfig
}) => string | Promise<string>

export interface GeneratedAdapter {
  handleUpload: HandleUpload
  handleDelete: HandleDelete
  generateURL: GenerateURL
  webpack?: (config: WebpackConfig) => WebpackConfig
}

export type Adapter = (args: { collection: CollectionConfig }) => GeneratedAdapter

export interface CollectionOptions {
  slug: string
  disableLocalStorage?: boolean
  adapter: Adapter
}

export interface PluginOptions {
  collections: CollectionOptions[]
}
