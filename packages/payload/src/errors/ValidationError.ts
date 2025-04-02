import type { TFunction } from '@payloadcms/translations'

import { en } from '@payloadcms/translations/languages/en'
import { status as httpStatus } from 'http-status'

import type { LabelFunction, StaticLabel } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from './APIError.js'

// This gets dynamically reassigned during compilation
export let ValidationErrorName = 'ValidationError'

export type ValidationFieldError = {
  label?: LabelFunction | StaticLabel
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
      /**
       *  req needs to be passed through (if you have one) in order to resolve label functions that may be part of the errors array
       */
      req?: Partial<PayloadRequest>
    },
    t?: TFunction,
  ) {
    const message = t
      ? t('error:followingFieldsInvalid', { count: results.errors.length })
      : results.errors.length === 1
        ? en.translations.error.followingFieldsInvalid_one
        : en.translations.error.followingFieldsInvalid_other

    const req = results.req
    // delete to avoid logging the whole req
    delete results['req']

    super(
      `${message} ${results.errors
        .map((f) => {
          if (f.label) {
            if (typeof f.label === 'function') {
              if (!req || !req.i18n || !req.t) {
                return f.path
              }

              return f.label({ i18n: req.i18n, t: req.t })
            }

            if (typeof f.label === 'object') {
              if (req?.i18n?.language) {
                return f.label[req.i18n.language]
              }

              return f.label[Object.keys(f.label)[0]]
            }

            return f.label
          }

          return f.path
        })
        .join(', ')}`,
      httpStatus.BAD_REQUEST,
      results,
    )

    ValidationErrorName = this.constructor.name
  }
}
