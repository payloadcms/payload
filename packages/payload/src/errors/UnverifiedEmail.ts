import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'

import { httpStatus } from '../utilities/httpStatus.js'
import { APIError } from './APIError.js'

export class UnverifiedEmail extends APIError {
  constructor({ t }: { t?: TFunction }) {
    super(
      t ? t('error:unverifiedEmail') : en.translations.error.unverifiedEmail,
      httpStatus.FORBIDDEN,
    )
    this.name = 'UnverifiedEmail'
  }
}
