import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class FileUploadError extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:problemUploadingFile') : 'There was a problem while uploading the file.',
      httpStatus.BAD_REQUEST,
    )
  }
}

export default FileUploadError
