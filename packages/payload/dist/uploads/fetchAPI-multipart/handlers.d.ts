import type { FetchAPIFileUploadOptions } from '../../config/types.js';
type Handler = (options: FetchAPIFileUploadOptions, fieldname: string, filename: string) => {
    cleanup: () => void;
    complete: () => Buffer;
    dataHandler: (data: Buffer) => void;
    getFilePath: () => string;
    getFileSize: () => number;
    getHash: () => string;
    getWritePromise: () => Promise<boolean>;
};
export declare const tempFileHandler: Handler;
export declare const memHandler: Handler;
export {};
//# sourceMappingURL=handlers.d.ts.map