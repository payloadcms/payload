/**
 * Re-export R2 API types from Cloudflare so we stay in sync with Workers bindings.
 * Using the same types as @cloudflare/workers-types avoids drift and ensures
 * cloudflare.env.R2 is assignable without type assertions.
 * Uses 2023-07-01 compatibility date for stability; newer dates remain compatible.
 */
export type {
  R2Bucket,
  R2GetOptions,
  R2MultipartUpload,
  R2Object,
  R2ObjectBody,
  R2Range,
  R2UploadedPart,
} from '@cloudflare/workers-types/2023-07-01'

export interface R2StorageClientUploadContext {
  key: string
}
export type R2StorageClientUploadHandlerParams = {
  chunkSize?: number
  prefix: string
}

export type R2StorageMultipartUploadHandlerParams = {
  collection: string
  fileName: string
  fileType: string
  multipartId?: string
  multipartKey?: string
  multipartNumber?: string
}
