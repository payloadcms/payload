import httpStatus from 'http-status';
import type { TFunction } from 'i18next';
import APIError from './APIError';

class MissingFile extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:noFilesUploaded') : 'No files were uploaded.', httpStatus.BAD_REQUEST);
  }
}

export default MissingFile;
