import type { TFunction } from 'i18next'

import httpStatus from 'http-status'

import APIError from './APIError'

class ValidationError extends APIError<{ field: string; message: string }[]> {
  constructor(results: { field: string; message: string }[], t?: TFunction) {
    const message = t
      ? t('error:followingFieldsInvalid', { count: results.length })
      : `The following field${results.length === 1 ? ' is' : 's are'} invalid:`
    super(`${message} ${results.map((f) => f.field).join(', ')}`, httpStatus.BAD_REQUEST, results)
  }
}

export default ValidationError
