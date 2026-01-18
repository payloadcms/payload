import type { FetchAPIFileUploadOptions } from '../../config/types.js';
import type { FetchAPIFileUploadResponse } from './index.js';
declare const waitFlushProperty: unique symbol;
declare global {
    interface Request {
        [waitFlushProperty]?: Promise<any>[];
    }
}
type ProcessMultipart = (args: {
    options: FetchAPIFileUploadOptions;
    request: Request;
}) => Promise<FetchAPIFileUploadResponse>;
export declare const processMultipart: ProcessMultipart;
export {};
//# sourceMappingURL=processMultipart.d.ts.map