import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class ErrorDeletingFile extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:deletingFile') : en.translations.error.deletingFile,
      httpStatus.INTERNAL_SERVER_ERROR,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'ErrorDeletingFile'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ErrorDeletingFile.prototype)
  }
}
