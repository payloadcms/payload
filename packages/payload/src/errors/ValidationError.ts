import type { TFunction } from '@payloadcms/translations'

import { translations } from '@payloadcms/translations/api'
import httpStatus from 'http-status'

import APIError from './APIError'

class ValidationError extends APIError<{ field: string; message: string }[]> {
  constructor(results: { field: string; message: string }[], t?: TFunction) {
    const message = t
      ? t('error:followingFieldsInvalid', { count: results.length })
      : results.length === 1
      ? translations.en.error.followingFieldsInvalid_one
      : translations.en.error.followingFieldsInvalid_other

    super(`${message} ${results.map((f) => f.field).join(', ')}`, httpStatus.BAD_REQUEST, results)
  }
}

export default ValidationError
