import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class ErrorDeletingFile extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:deletingFile') : 'There was an error deleting file.',
      httpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}

export default ErrorDeletingFile
