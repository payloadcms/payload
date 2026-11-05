import type { Config } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'

export type CanTransformArgs = {
  collectionSlug: string
  documentID?: number | string
  mimeType: string
  operation: 'request' | 'upload'
  req: PayloadRequest
}

export type TransformFileArgs<TOptions = unknown> = {
  collectionSlug: string
  file: File
  options: TOptions
  req: PayloadRequest
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
  documentID: number | string
  filename: string
  getSourceFile: () => Promise<Response>
  mimeType: string
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
