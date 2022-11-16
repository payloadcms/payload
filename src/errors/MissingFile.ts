import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class MissingFile extends APIError {
  constructor(i18n?: Ii18n) {
    super(i18n?.t('error:noFilesUploaded') || 'No files were uploaded.', httpStatus.BAD_REQUEST);
  }
}

export default MissingFile;
