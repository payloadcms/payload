import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class ErrorDeletingFile extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:deletingFile') : translations.en.error.deletingFile,
      httpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}

export default ErrorDeletingFile
