import { en } from '@payloadcms/translations/languages/en';
import { status as httpStatus } from 'http-status';
import { APIError } from './APIError.js';
export class NotFound extends APIError {
    constructor(t){
        super(t ? t('general:notFound') : en.translations.general.notFound, httpStatus.NOT_FOUND);
    }
}

//# sourceMappingURL=NotFound.js.map