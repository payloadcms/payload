import { en } from '@payloadcms/translations/languages/en';
import { status as httpStatus } from 'http-status';
import { APIError } from './APIError.js';
export class MissingFile extends APIError {
    constructor(t){
        super(t ? t('error:noFilesUploaded') : en.translations.error.noFilesUploaded, httpStatus.BAD_REQUEST);
    }
}

//# sourceMappingURL=MissingFile.js.map