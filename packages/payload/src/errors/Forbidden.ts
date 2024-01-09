import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class Forbidden extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:notAllowedToPerformAction') : translations.en.error.notAllowedToPerformAction,
      httpStatus.FORBIDDEN,
    )
  }
}

export default Forbidden
