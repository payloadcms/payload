import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class LockedAuth extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:userLocked') : translations.en.error.userLocked, httpStatus.UNAUTHORIZED)
  }
}

export default LockedAuth
