import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class FileUploadError extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:problemUploadingFile') : translations.en.error.problemUploadingFile,
      httpStatus.BAD_REQUEST,
    )
  }
}

export default FileUploadError
