import type { TFunction } from '@payloadcms/translations'

import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class FileRetrievalError extends APIError {
  constructor(t?: TFunction, message?: string) {
    let msg = t ? t('error:problemUploadingFile') : 'There was a problem while retrieving the file.'

    if (message) {
      msg += ` ${message}`
    }
    super(msg, httpStatus.INTERNAL_SERVER_ERROR)
  }
}
