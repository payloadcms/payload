import type { TFunction } from '@payloadcms/translations'

import en from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import APIError from './APIError.js'

class LockedAuth extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:userLocked') : en.error.userLocked, httpStatus.UNAUTHORIZED)
  }
}

export default LockedAuth
