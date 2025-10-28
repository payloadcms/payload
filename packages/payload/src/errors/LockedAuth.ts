import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class LockedAuth extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:userLocked') : en.translations.error.userLocked, httpStatus.UNAUTHORIZED)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'LockedAuth'
    Object.defineProperty(this.constructor, 'name', { value: 'LockedAuth' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, LockedAuth.prototype)
  }
}
