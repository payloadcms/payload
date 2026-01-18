import type { FetchAPIFileUploadOptions } from '../../config/types.js';
import { APIError } from '../../errors/APIError.js';
export type FileShape = {
    data: Buffer;
    encoding: string;
    md5: Buffer | string;
    mimetype: string;
    mv: (filePath: string, callback: () => void) => Promise<void> | void;
    name: string;
    size: number;
    tempFilePath: string;
    truncated: boolean;
};
type FetchAPIFileUploadResponseFile = {
    data: Buffer;
    mimetype: string;
    name: string;
    size: number;
    tempFilePath?: string;
};
export type FetchAPIFileUploadResponse = {
    error?: APIError;
    fields: Record<string, string>;
    files: Record<string, FetchAPIFileUploadResponseFile>;
};
type FetchAPIFileUpload = (args: {
    options?: FetchAPIFileUploadOptions;
    request: Request;
}) => Promise<FetchAPIFileUploadResponse>;
export declare const processMultipartFormdata: FetchAPIFileUpload;
export {};
//# sourceMappingURL=index.d.ts.map