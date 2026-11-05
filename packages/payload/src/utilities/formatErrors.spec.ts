import { describe, expect, it } from 'vitest'

import { APIError } from '../errors/APIError.js'
import { ValidationError } from '../errors/ValidationError.js'
import { formatErrors } from './formatErrors.js'

describe('formatErrors', () => {
  it('should format a Payload ValidationError', () => {
    const err = new ValidationError({
      errors: [{ message: 'Field is required', path: 'title' }],
    })

    const result = formatErrors(err)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      name: 'ValidationError',
      message: expect.stringContaining('title'),
      data: { errors: [{ message: 'Field is required', path: 'title' }] },
    })
  })

  it('should format a Payload APIError', () => {
    const err = new APIError('Something went wrong', 400, { detail: 'bad input' }, true)

    const result = formatErrors(err)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      name: 'APIError',
      message: 'Something went wrong',
      data: { detail: 'bad input' },
    })
  })

  it('should format a Mongoose-style ValidationError', () => {
    const mongooseError = {
      name: 'ValidationError',
      errors: {
        email: { path: 'email', message: 'is invalid' },
      },
    }

    const result = formatErrors(mongooseError as any)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ field: 'email', message: 'is invalid' })
  })

  it('should format an array message error', () => {
    const err = { message: [{ message: 'item one' }, { message: 'item two' }] }

    const result = formatErrors(err as any)

    expect(result.errors).toHaveLength(2)
    expect(result.errors[0]).toMatchObject({ message: 'item one' })
    expect(result.errors[1]).toMatchObject({ message: 'item two' })
  })

  it('should format a named non-Payload error', () => {
    const err = new Error('Unexpected failure')

    const result = formatErrors(err as any)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]!.message).toBe('Unexpected failure')
  })

  it('should format a Payload APIError with no data', () => {
    const err = new APIError('Server error')

    const result = formatErrors(err)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toStrictEqual({ message: 'Server error' })
  })

  it('should return unknown error for null/undefined input', () => {
    expect(formatErrors(null as any).errors[0]!.message).toBe('An unknown error occurred.')
    expect(formatErrors(undefined as any).errors[0]!.message).toBe('An unknown error occurred.')
  })
})
