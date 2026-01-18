import type { FetchAPIFileUploadOptions } from '../../config/types.js';
import type { FileShape } from './index.js';
type FileFactoryOptions = {
    buffer: Buffer;
    encoding: string;
    hash: Buffer | string;
    mimetype: string;
    name: string;
    size: number;
    tempFilePath: string;
    truncated: boolean;
};
type FileFactory = (options: FileFactoryOptions, fileUploadOptions: FetchAPIFileUploadOptions) => FileShape;
export declare const fileFactory: FileFactory;
export {};
//# sourceMappingURL=fileFactory.d.ts.map