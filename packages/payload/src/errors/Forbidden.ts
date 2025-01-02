import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import { APIError } from './APIError.js'

export class Forbidden extends APIError {
  constructor(t?: TFunction) {
    const newPrototype = new.target.prototype

    super(
      t ? t('error:notAllowedToPerformAction') : en.translations.error.notAllowedToPerformAction,
      httpStatus.FORBIDDEN,
    )

    Reflect.setPrototypeOf(this, newPrototype)
  }
}
