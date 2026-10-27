import type { Config } from '../../config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'

/**
 * A lazy, storage-neutral, read-only view of a file. No bytes are read until a method is
 * called, and each call reads the file again. A byte range is `numberOfBytes` bytes starting
 * at `startByte`, and must be inside `sizeInBytes`.
 */
export type FileSource = {
  filename: string
  mimeType: string
  /** Loads one small byte range into memory. */
  readFileBytes: (args: {
    numberOfBytes: number
    signal?: AbortSignal
    startByte: number
  }) => Promise<Uint8Array>
  sizeInBytes: number
  /**
   * Streams the byte range, or the whole file when called with no range. A transformer that
   * needs the whole file in memory must enforce its own byte limit while it reads the stream.
   */
  streamFile: (args?: {
    numberOfBytes?: number
    signal?: AbortSignal
    startByte?: number
  }) => Promise<ReadableStream<Uint8Array>>
}

export type CanTransformArgs = {
  collectionSlug: string
  /** The current document. Read-only: routing must not change it. */
  doc: Readonly<Document>
  documentID?: number | string
  mimeType: string
  operation: 'request' | 'upload'
  /**
   * The stored document before this operation, as in hooks, or the incoming data on a create.
   * Frozen.
   */
  originalDoc: Readonly<Document>
  req: PayloadRequest
}

export type TransformFileArgs<TOptions = unknown> = {
  collectionSlug: string
  /**
   * The working copy of the document, passed in order through the stages. A stage may change
   * `doc._transforms`, and later stages see the change. Payload saves the final value, after the
   * normal hooks and validation. A change to any other field fails the upload.
   */
  doc: Document
  /** The current pipeline file. The same file as `source`. */
  file: File
  options: TOptions
  /**
   * The stored document before this operation, as in hooks, or the incoming data on a create.
   * Frozen.
   */
  originalDoc: Readonly<Document>
  /** The retained original file, before any transformer changed it. */
  originalSource: FileSource
  req: PayloadRequest
  /** The current pipeline file: the upload, or the file that the previous stage returned. */
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
  /** The requested document. Read-only: a request does not save changes. */
  doc: Readonly<Document>
  documentID: number | string
  filename: string
  getSourceFile: () => Promise<Response>
  mimeType: string
  /** A frozen snapshot of the requested document. */
  originalDoc: Readonly<Document>
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
  canTransform?: (args: CanTransformArgs) => boolean | Promise<boolean>
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
   * One-file-in, one-file-out upload processing primitive. Never writes to storage.
   */
  transformFile?: (args: TransformFileArgs) => Promise<TransformFileResult>
}
