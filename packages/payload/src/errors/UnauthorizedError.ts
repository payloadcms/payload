import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class UnauthorizedError extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:unauthorized') : en.translations.error.unauthorized, httpStatus.UNAUTHORIZED)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'UnauthorizedError'
    Object.defineProperty(this.constructor, 'name', { value: 'UnauthorizedError' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}
