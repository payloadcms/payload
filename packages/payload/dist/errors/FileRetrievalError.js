import { status as httpStatus } from 'http-status';
import { APIError } from './APIError.js';
export class FileRetrievalError extends APIError {
    constructor(t, message){
        let msg = t ? t('error:problemUploadingFile') : 'There was a problem while retrieving the file.';
        if (message) {
            msg += ` ${message}`;
        }
        super(msg, httpStatus.INTERNAL_SERVER_ERROR);
    }
}

//# sourceMappingURL=FileRetrievalError.js.map