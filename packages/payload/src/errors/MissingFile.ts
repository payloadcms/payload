import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

export class MissingFile extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:noFilesUploaded') : en.translations.error.noFilesUploaded,
      httpStatus.BAD_REQUEST,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'MissingFile'
    Object.defineProperty(this.constructor, 'name', { value: 'MissingFile' })
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, MissingFile.prototype)
  }
}
