import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class NotFound extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('general:notFound') : en.translations.general.notFound, httpStatus.NOT_FOUND)

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'NotFound'
    Object.defineProperty(this.constructor, 'name', { value: 'NotFound' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, NotFound.prototype)
  }
}
