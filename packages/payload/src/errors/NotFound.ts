import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class NotFound extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:notFound') : 'The requested resource was not found.', httpStatus.NOT_FOUND)
  }
}

export default NotFound
