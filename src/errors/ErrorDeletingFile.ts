import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class ErrorDeletingFile extends APIError {
  constructor(i18n: Ii18n) {
    super(i18n.t('error:deletingFile'), httpStatus.INTERNAL_SERVER_ERROR);
  }
}

export default ErrorDeletingFile;
