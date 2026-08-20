import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { ValidationError } from '../errors/index.js'
import { toValidationResult } from './toValidationResult.js'

describe('toValidationResult', () => {
  it('maps a ValidationError to field errors tagged with the request locale', () => {
    const req = { locale: 'de' } as PayloadRequest
    const error = new ValidationError({
      errors: [{ label: 'Title', message: 'Title is required', path: 'title' }],
    })

    expect(toValidationResult({ error, req })).toEqual({
      errors: [{ label: 'Title', locale: 'de', message: 'Title is required', path: 'title' }],
      valid: false,
    })
  })

  it('omits the locale when the request has none', () => {
    const req = {} as PayloadRequest
    const error = new ValidationError({
      errors: [{ message: 'Title is required', path: 'title' }],
    })

    expect(toValidationResult({ error, req })).toEqual({
      errors: [{ locale: undefined, message: 'Title is required', path: 'title' }],
      valid: false,
    })
  })

  it('rethrows errors that are not a ValidationError', () => {
    const req = { locale: 'en' } as PayloadRequest
    const error = new Error('boom')

    expect(() => toValidationResult({ error, req })).toThrow(error)
  })
})
