import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class FileUploadError extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:problemUploadingFile') : en.translations.error.problemUploadingFile,
      httpStatus.BAD_REQUEST,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'FileUploadError'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, FileUploadError.prototype)
  }
}
