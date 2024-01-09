import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class AuthenticationError extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:emailOrPasswordIncorrect') : translations.en.error.emailOrPasswordIncorrect,
      httpStatus.UNAUTHORIZED,
    )
  }
}

export default AuthenticationError
