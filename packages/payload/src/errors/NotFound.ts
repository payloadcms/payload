import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class NotFound extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('general:notFound') : translations.en.general.notFound, httpStatus.NOT_FOUND)
  }
}

export default NotFound
