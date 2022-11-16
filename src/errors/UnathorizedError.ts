import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class UnauthorizedError extends APIError {
  constructor(i18n?: Ii18n) {
    super(i18n?.t('error:unauthorized') || 'Unauthorized, you must be logged in to make this request.', httpStatus.UNAUTHORIZED);
  }
}

export default UnauthorizedError;
