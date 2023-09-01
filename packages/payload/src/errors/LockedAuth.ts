import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class LockedAuth extends APIError {
  constructor(t?: TFunction) {
    super(
      t
        ? t('error:userLocked')
        : 'This user is locked due to having too many failed login attempts.',
      httpStatus.UNAUTHORIZED,
    )
  }
}

export default LockedAuth
