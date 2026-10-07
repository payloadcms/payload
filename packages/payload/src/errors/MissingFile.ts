import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'

import { httpStatus } from '../utilities/httpStatus.js'
import { APIError } from './APIError.js'

export class MissingFile extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:noFilesUploaded') : en.translations.error.noFilesUploaded,
      httpStatus.BAD_REQUEST,
    )
    this.name = 'MissingFile'
  }
}
