import httpStatus from 'http-status';
import type { TFunction } from 'i18next';
import APIError from './APIError';

class EmailNotVerifiedError extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:emailNotVerified') : 'Email not verified', httpStatus.UNAUTHORIZED);
  }
}

export default EmailNotVerifiedError;
