import { en } from '@payloadcms/translations/languages/en';
import { status as httpStatus } from 'http-status';
import { APIError } from './APIError.js';
export class LockedAuth extends APIError {
    constructor(t){
        super(t ? t('error:userLocked') : en.translations.error.userLocked, httpStatus.UNAUTHORIZED);
    }
}

//# sourceMappingURL=LockedAuth.js.map