import type { PayloadRequest } from '../../types/index.js'
import type { UploadEdits } from '../types.js'

/**
 * Private v4 compatibility bridge, attached to a transformer object under this
 * symbol. Lets the official Sharp package reproduce the current main-image and
 * legacy `sizes` upload behavior without core exposing a general persisted-
 * variants API. Never exported from `payload` — `payload/internal` only, and
 * never documented for third-party use.
 */
export const uploadTransformerInternal = Symbol.for('payload.uploadTransformerInternal')

export type UploadTransformTask<TOptions = unknown> = {
  fieldPath: 'filename' | `sizes.${string}`
  options: TOptions
}

export type PreparedUploadTransformation = {
  fieldPath: 'filename' | `sizes.${string}`
  /** Omitted when this task was intentionally skipped (e.g. an image size too small to enlarge) — recorded with null metadata, matching the existing `sizes` shape. */
  file?: File
  height?: number
  mimeType?: string
  width?: number
}

export type UploadTransformerInternal = {
  prepareUpload?: (args: {
    collectionSlug: string
    file: File
    req: PayloadRequest
    transform: (task: UploadTransformTask) => Promise<File>
    uploadEdits: UploadEdits
  }) => Promise<PreparedUploadTransformation[]>
}

export type TransformerWithInternalBridge = {
  [uploadTransformerInternal]?: UploadTransformerInternal
}

export function getUploadTransformerInternal(
  transformer: object,
): undefined | UploadTransformerInternal {
  return (transformer as TransformerWithInternalBridge)[uploadTransformerInternal]
}
