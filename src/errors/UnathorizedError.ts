import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class UnauthorizedError extends APIError {
  constructor(i18n: Ii18n) {
    super(i18n.t('error:unauthorized'), httpStatus.UNAUTHORIZED);
  }
}

export default UnauthorizedError;
