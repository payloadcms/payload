import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import { APIError } from './APIError.js'

export class ValidationError extends APIError<{ field: string; message: string }[]> {
  constructor(results: { field: string; message: string }[], t?: TFunction) {
    const message = t
      ? t('error:followingFieldsInvalid', { count: results.length })
      : results.length === 1
        ? en.translations.error.followingFieldsInvalid_one
        : en.translations.error.followingFieldsInvalid_other

    super(`${message} ${results.map((f) => f.field).join(', ')}`, httpStatus.BAD_REQUEST, results)
  }
}
