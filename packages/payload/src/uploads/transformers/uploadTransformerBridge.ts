import type { PayloadRequest } from '../../types/index.js'
import type { UploadEdits } from '../types.js'
import type { UploadDocument } from './types.js'

/**
 * Private v4 compatibility bridge, attached to a transformer object under this
 * symbol. Lets the official Sharp package reproduce the current main-image and
 * legacy `variants` upload behavior without core exposing a general persisted-
 * variants API. Never exported from `payload` — `payload/internal` only, and
 * never documented for third-party use.
 */
export const uploadTransformerInternal = Symbol.for('payload.uploadTransformerInternal')
const uploadFilePath = Symbol.for('payload.uploadFilePath')

type FileWithUploadPath = {
  [uploadFilePath]?: string
} & File

export function getUploadFilePath(file: File): string | undefined {
  return (file as FileWithUploadPath)[uploadFilePath]
}

export function setUploadFilePath(file: File, filePath: string): File {
  Object.defineProperty(file, uploadFilePath, { value: filePath })
  return file
}

export type UploadTransformTask<TOptions = unknown> = {
  fieldPath: 'filename' | `variants.${string}`
  /** Source file for this task. Defaults to the original upload (e.g. pass the cropped main output so sizes derive from the crop). */
  file?: File
  options: TOptions
}

export type PreparedUploadTransformation = {
  fieldPath: 'filename' | `variants.${string}`
  /** Omitted when this task was intentionally skipped (e.g. an image size too small to enlarge) — recorded with null metadata, matching the existing `variants` shape. */
  file?: File
  height?: number
  mimeType?: string
  width?: number
}

export type UploadTransformerInternal = {
  /**
   * Whether this bridge owns upload-time processing for the collection. When several
   * transformers carry a bridge, core drives the upload through the one that owns the
   * collection, falling back to the first bridge when none does.
   */
  handlesCollection?: (args: { collectionSlug: string }) => boolean
  /** Byte bound for the private whole-file variant bridge. */
  maxSourceBytes?: number
  prepareUpload?: (args: {
    collectionSlug: string
    doc: UploadDocument
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
