import type { JSONSchema4 } from 'json-schema'

import type { Config } from '../../config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'

/** Lazy storage-neutral input. Whole-file consumers must declare a byte limit. */
export type FileSource = {
  arrayBuffer: (args: { maxBytes: number }) => Promise<ArrayBuffer>
  filename: string
  mimeType: string
  read: (args: { length: number; offset?: number }) => Promise<ArrayBuffer>
  size?: number
  stream: () => Promise<ReadableStream<Uint8Array>>
}

/** Optional custom-key schema used for generated types and JSDoc, not runtime validation. */
export type TransformDefinition = JSONSchema4

export type UploadDocument = Document

export type CanTransformResult<TOptions = unknown> =
  | { canTransform: true; handledTransformKeys?: string[]; options?: TOptions }
  | boolean

export type PlannedTransformer = {
  handledTransformKeys?: string[]
  options?: unknown
  transformer: UploadTransformer
}

type BaseCanTransformArgs = {
  collectionSlug: string
  doc: UploadDocument
  originalDoc: Readonly<UploadDocument>
  req: PayloadRequest
}

export type CanTransformArgs = (
  | { operation: 'request'; purpose?: 'persisted-default' | 'preview' | 'request-override' }
  | { operation: 'upload' }
) &
  BaseCanTransformArgs

export type TransformFileArgs<TOptions = unknown> = {
  collectionSlug: string
  doc: UploadDocument
  options: TOptions
  originalDoc: Readonly<UploadDocument>
  originalSource: FileSource
  req: PayloadRequest
  source: FileSource
}

export type TransformFileResult =
  | {
      file: File
      status: 'complete'
    }
  | {
      file?: File
      status: 'continue'
    }

export type HandleTransformRequestArgs = {
  collectionSlug: string
  doc: UploadDocument
  getOriginalFile: () => Promise<Response>
  getSourceFile: () => Promise<Response>
  options?: unknown
  originalDoc: Readonly<UploadDocument>
  purpose?: 'persisted-default' | 'preview' | 'request-override'
  req: PayloadRequest
}

export type HandleTransformRequestResult =
  | {
      response: Response
      status: 'complete'
    }
  | {
      response?: Response
      status: 'continue'
    }

/**
 * A capability adapter that can transform files during upload, handle dynamic
 * file requests, or both. Configured only under `upload.transformers`.
 */
export type UploadTransformer = {
  /**
   * Inexpensive, side-effect-free routing predicate. Must not fetch the source,
   * call an external service, or perform the transformation.
   */
  canTransform?: (args: CanTransformArgs) => CanTransformResult | Promise<CanTransformResult>
  /**
   * Handles one stage of a dynamic transformation request.
   */
  handleRequest?: (args: HandleTransformRequestArgs) => Promise<HandleTransformRequestResult>
  /**
   * Runs once during `buildConfig`, between the `plugins` loop and storage-adapter
   * `init()`, for configuration validation and transformer-specific setup.
   */
  init?: (config: Config) => Config | Promise<Config>
  /**
   * MIME patterns this transformer supports: exact values (`image/png`), a category
   * wildcard (`image/*`), or the universal wildcard matching every type and subtype.
   */
  mimeTypes: string[]
  /**
   * Must be unique across `upload.transformers`.
   */
  slug: string
  /**
   * Optional custom-key definitions for generated types and JSDoc. Built-in keys
   * cannot be redefined. These neither claim keys nor replace adapter validation.
   */
  transformDefinitions?: Record<string, TransformDefinition>
  /**
   * One-file-in, one-file-out upload processing primitive. Never writes to storage.
   */
  transformFile?: (args: TransformFileArgs) => Promise<TransformFileResult>
}
