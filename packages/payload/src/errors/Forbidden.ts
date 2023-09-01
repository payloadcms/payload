import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class Forbidden extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:notAllowedToPerformAction') : 'You are not allowed to perform this action.',
      httpStatus.FORBIDDEN,
    )
  }
}

export default Forbidden
