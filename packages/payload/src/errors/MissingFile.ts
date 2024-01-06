import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class MissingFile extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t('error:noFilesUploaded') : translations.en.error.noFilesUploaded,
      httpStatus.BAD_REQUEST,
    )
  }
}

export default MissingFile
