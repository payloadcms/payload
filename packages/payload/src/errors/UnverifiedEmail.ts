import type { TFunction } from '@ruya.sa/translations'

import { en } from '@ruya.sa/translations/languages/en'
import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class UnverifiedEmail extends APIError {
  constructor({ t }: { t?: TFunction }) {
    super(
      t ? t('error:unverifiedEmail') : en.translations.error.unverifiedEmail,
      httpStatus.FORBIDDEN,
    )
  }
}
