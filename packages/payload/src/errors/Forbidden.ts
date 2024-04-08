import type { TFunction } from '@payloadcms/translations'

import en from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import APIError from './APIError.js'

class Forbidden extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:notAllowedToPerformAction') : en.error.notAllowedToPerformAction,
      httpStatus.FORBIDDEN,
    )
  }
}

export default Forbidden
