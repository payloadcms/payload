import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class UnverifiedAuth extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:userUnverified') : 'This user has not verified their email address.',
      httpStatus.UNAUTHORIZED,
    )
  }
}

export default UnverifiedAuth
