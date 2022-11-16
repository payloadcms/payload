import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class NotFound extends APIError {
  constructor(i18n?: Ii18n) {
    super(i18n?.t('error:notFound') || 'The requested resource was not found.', httpStatus.NOT_FOUND);
  }
}

export default NotFound;
