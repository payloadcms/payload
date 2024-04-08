import type { TFunction } from '@payloadcms/translations'

import en from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import APIError from './APIError.js'

class ErrorDeletingFile extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:deletingFile') : en.error.deletingFile, httpStatus.INTERNAL_SERVER_ERROR)
  }
}

export default ErrorDeletingFile
