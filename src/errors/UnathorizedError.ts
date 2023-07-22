import httpStatus from 'http-status';
import type { TFunction } from 'i18next';
import APIError from './APIError';

class UnauthorizedError extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:unauthorized') : 'Unauthorized, you must be logged in to make this request.', httpStatus.UNAUTHORIZED);
  }
}

export default UnauthorizedError;
