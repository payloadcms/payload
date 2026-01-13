export interface R2Bucket {
  createMultipartUpload(key: string, options?: any): Promise<R2MultipartUpload>
  delete(keys: string | string[]): Promise<void>
  get(
    key: string,
    options: {
      onlyIf: any | Headers
    } & any,
  ): Promise<any | null>
  get(key: string, options?: any): Promise<any | null>
  head(key: string): Promise<any>
  list(options?: any): Promise<any>
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | null | ReadableStream | string,
    options?: {
      httpMetadata?: any | Headers
      onlyIf: any
    } & any,
  ): Promise<any | null>
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

export interface R2UploadedPart {
  etag: string
  partNumber: number
}
