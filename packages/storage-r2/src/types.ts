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
