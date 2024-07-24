import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import { APIError } from './APIError.js'

export class AuthenticationError extends APIError {
  constructor(t?: TFunction, loginWithUsername?: boolean) {
    super(
      t
        ? `${loginWithUsername ? t('error:usernameOrPasswordIncorrect') : t('error:emailOrPasswordIncorrect')}`
        : en.translations.error.emailOrPasswordIncorrect,
      httpStatus.UNAUTHORIZED,
    )
  }
}
