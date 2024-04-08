import type { TFunction } from '@payloadcms/translations'

import en from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import APIError from './APIError.js'

class AuthenticationError extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:emailOrPasswordIncorrect') : en.error.emailOrPasswordIncorrect,
      httpStatus.UNAUTHORIZED,
    )
  }
}

export default AuthenticationError
