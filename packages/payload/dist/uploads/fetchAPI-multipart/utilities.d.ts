import type { FetchAPIFileUploadOptions } from '../../config/types.js';
/**
 * Logs message to console if options.debug option set to true.
 */
export declare const debugLog: (options: FetchAPIFileUploadOptions, msg: string) => boolean;
/**
 * Generates unique temporary file name. e.g. tmp-5000-156788789789.
 */
export declare const getTempFilename: (prefix?: string) => string;
type FuncType = (...args: any[]) => any;
export declare const isFunc: (value: any) => value is FuncType;
/**
 * Return a callback function for promise resole/reject args.
 * Ensures that callback is called only once.
 */
type PromiseCallback = (resolve: () => void, reject: (err: Error) => void) => (err: Error) => void;
export declare const promiseCallback: PromiseCallback;
/**
 * Determines whether a key insertion into an object could result in a prototype pollution
 */
type IsSafeFromPollution = (base: any, key: string) => boolean;
export declare const isSafeFromPollution: IsSafeFromPollution;
/**
 * Build request field/file objects to return
 */
type BuildFields = (instance: any, field: string, value: any) => any;
export declare const buildFields: BuildFields;
/**
 * Creates a folder if it does not exist
 * for file specified in the path variable
 */
type CheckAndMakeDir = (fileUploadOptions: FetchAPIFileUploadOptions, filePath: string) => boolean;
export declare const checkAndMakeDir: CheckAndMakeDir;
/**
 * Delete a file.
 */
type DeleteFile = (filePath: string, callback: (args: any) => void) => void;
export declare const deleteFile: DeleteFile;
/**
 * moveFile: moves the file from src to dst.
 * Firstly trying to rename the file if no luck copying it to dst and then deleting src.
 */
type MoveFile = (src: string, dst: string, callback: (err: Error, renamed?: boolean) => void) => void;
export declare const moveFile: MoveFile;
/**
 * Save buffer data to a file.
 * @param {Buffer} buffer - buffer to save to a file.
 * @param {string} filePath - path to a file.
 */
export declare const saveBufferToFile: (buffer: Buffer, filePath: string, callback: (err?: Error) => void) => void;
/**
 * Parses filename and extension and returns object {name, extension}.
 */
type ParseFileNameExtension = (preserveExtension: boolean | number, fileName: string) => {
    extension: string;
    name: string;
};
export declare const parseFileNameExtension: ParseFileNameExtension;
/**
 * Parse file name and extension.
 */
type ParseFileName = (opts: FetchAPIFileUploadOptions, fileName: string) => string;
export declare const parseFileName: ParseFileName;
export {};
//# sourceMappingURL=utilities.d.ts.map