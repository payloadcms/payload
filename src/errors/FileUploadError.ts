import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class FileUploadError extends APIError {
  constructor(i18n: Ii18n) {
    super(i18n.t('problemUploadingFile'), httpStatus.BAD_REQUEST);
  }
}

export default FileUploadError;
