export interface R2Bucket {
  createMultipartUpload(key: string, options?: any): Promise<any>
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
  resumeMultipartUpload(key: string, uploadId: string): any
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

  writeHttpMetadata(headers: Headers): void
}
export interface R2ObjectBody extends R2Object {
  get body(): ReadableStream
}
