import { en } from '@payloadcms/translations/languages/en';
import { status as httpStatus } from 'http-status';
import { APIError } from './APIError.js';
export class AuthenticationError extends APIError {
    constructor(t, loginWithUsername){
        super(t ? `${loginWithUsername ? t('error:usernameOrPasswordIncorrect') : t('error:emailOrPasswordIncorrect')}` : en.translations.error.emailOrPasswordIncorrect, httpStatus.UNAUTHORIZED);
    }
}

//# sourceMappingURL=AuthenticationError.js.map