import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import httpStatus from 'http-status'

import { APIError } from './APIError.js'

// This gets dynamically reassigned during compilation
export let ValidationErrorName = 'ValidationError'

export type ValidationFieldError = {
  // The error message to display for this field
  message: string
  path: string
}

export class ValidationError extends APIError<{
  collection?: string
  errors: ValidationFieldError[]
  global?: string
}> {
  constructor(
    results: {
      collection?: string
      errors: ValidationFieldError[]
      global?: string
      id?: number | string
    },
    t?: TFunction,
  ) {
    const message = t
      ? t('error:followingFieldsInvalid', { count: results.errors.length })
      : results.errors.length === 1
        ? en.translations.error.followingFieldsInvalid_one
        : en.translations.error.followingFieldsInvalid_other

    super(
      `${message} ${results.errors.map((f) => f.path).join(', ')}`,
      httpStatus.BAD_REQUEST,
      results,
    )

    ValidationErrorName = this.constructor.name
  }
}
