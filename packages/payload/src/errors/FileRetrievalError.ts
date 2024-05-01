import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class FileRetrievalError extends APIError {
  constructor(t?: TFunction, message?: string) {
    let msg = t ? t('error:problemUploadingFile') : 'There was a problem while retrieving the file.'

    if (message) {
      msg += ` ${message}`
    }
    super(msg, httpStatus.BAD_REQUEST)
  }
}

export default FileRetrievalError
