import path from 'path';
import { APIError } from '../../errors/APIError.js';
import { isEligibleRequest } from './isEligibleRequest.js';
import { processMultipart } from './processMultipart.js';
import { debugLog } from './utilities.js';
const DEFAULT_UPLOAD_OPTIONS = {
    abortOnLimit: false,
    createParentPath: false,
    debug: false,
    defParamCharset: 'utf8',
    limitHandler: false,
    parseNested: false,
    preserveExtension: false,
    responseOnLimit: 'File size limit has been reached',
    safeFileNames: false,
    tempFileDir: path.join(process.cwd(), 'tmp'),
    uploadTimeout: 60000,
    uriDecodeFileNames: false,
    useTempFiles: false
};
export const processMultipartFormdata = async ({ options: incomingOptions, request })=>{
    const options = {
        ...DEFAULT_UPLOAD_OPTIONS,
        ...incomingOptions
    };
    if (!isEligibleRequest(request)) {
        debugLog(options, 'Request is not eligible for file upload!');
        return {
            error: new APIError('Request is not eligible for file upload', 500),
            fields: undefined,
            files: undefined
        };
    } else {
        return processMultipart({
            options,
            request
        });
    }
};

//# sourceMappingURL=index.js.map