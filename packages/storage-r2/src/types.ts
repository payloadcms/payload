/**
 * R2 API types compatible with both Node (Miniflare) and Cloudflare Workers.
 * R2Range is aligned with Cloudflare's union so cloudflare.env.R2 is assignable
 * without type assertions. We use our own types (not @cloudflare/workers-types)
 * so Node's Blob/Buffer/Headers are accepted and we avoid strict Workers-only types.
 */
export type R2Range =
  | { length: number; offset?: number }
  | { length?: number; offset: number }
  | { suffix: number }

export interface R2GetOptions {
  [key: string]: any
  onlyIf?: any | Headers
  range?: R2Range
}

export interface R2Bucket {
  createMultipartUpload(key: string, options?: any): Promise<R2MultipartUpload>
  delete(keys: string | string[]): Promise<void>
  get(key: string, options?: R2GetOptions): Promise<null | R2ObjectBody>
  head(key: string): Promise<null | R2Object>
  list(options?: any): Promise<any>
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | null | ReadableStream | string,
    options?: any,
  ): Promise<any>
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload
}

interface R2HTTPMetadata {
  cacheControl?: string
  cacheExpiry?: Date
  contentDisposition?: string
  contentEncoding?: string
  contentLanguage?: string
  contentType?: string
}

export interface R2Object {
  readonly etag: string
  readonly httpMetadata?: R2HTTPMetadata
  readonly key: string
  readonly size: number
  writeHttpMetadata(headers: Headers): void
}

export interface R2ObjectBody extends R2Object {
  get body(): ReadableStream
}

export interface R2MultipartUpload {
  abort(): Promise<void>
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>
  readonly key: string
  readonly uploadId: string
  uploadPart(
    partNumber: number,
    value: (ArrayBuffer | ArrayBufferView) | Blob | ReadableStream | string,
    options?: any,
  ): Promise<R2UploadedPart>
}

export interface R2UploadedPart {
  etag: string
  partNumber: number
}

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
