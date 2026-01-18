export interface R2Range {
    /** The number of bytes to return */
    length?: number;
    /** The byte offset to start from (inclusive) */
    offset?: number;
    /** Return the last n bytes */
    suffix?: number;
}
export interface R2GetOptions {
    [key: string]: any;
    onlyIf?: any | Headers;
    range?: R2Range;
}
export interface R2Bucket {
    createMultipartUpload(key: string, options?: any): Promise<any>;
    delete(keys: string | string[]): Promise<void>;
    get(key: string, options?: R2GetOptions): Promise<any | null>;
    head(key: string): Promise<any>;
    list(options?: any): Promise<any>;
    put(key: string, value: ArrayBuffer | ArrayBufferView | Blob | null | ReadableStream | string, options?: {
        httpMetadata?: any | Headers;
        onlyIf: any;
    } & any): Promise<any | null>;
    put(key: string, value: ArrayBuffer | ArrayBufferView | Blob | null | ReadableStream | string, options?: any): Promise<any>;
    resumeMultipartUpload(key: string, uploadId: string): any;
}
//# sourceMappingURL=types.d.ts.map