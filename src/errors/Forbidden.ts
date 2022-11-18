import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class Forbidden extends APIError {
  constructor(i18n?: Ii18n) {
    super(i18n?.t('error:notAllowedToPerformAction') || 'You are not allowed to perform this action.', httpStatus.FORBIDDEN);
  }
}

export default Forbidden;
