import type { TFunction } from '@payloadcms/translations'

import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class FileRetrievalError<
  TData extends null | object = { [key: string]: unknown } | null,
> extends APIError<TData> {
  constructor(t?: TFunction, message?: string, cause?: TData) {
    let msg = t ? t('error:problemUploadingFile') : 'There was a problem while retrieving the file.'

    if (message) {
      msg += ` ${message}`
    }
    super(msg, httpStatus.INTERNAL_SERVER_ERROR, cause)
  }
}
