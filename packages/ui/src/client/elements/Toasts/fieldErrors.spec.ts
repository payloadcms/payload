import { describe, expect, it } from 'vitest'

import { createErrorsFromMessage } from './fieldErrors.js'

describe('createErrorsFromMessage', () => {
  it('should return the full message when there is no colon', () => {
    const result = createErrorsFromMessage('Something went wrong')

    expect(result).toEqual({ message: 'Something went wrong' })
  })

  it('should split a single field error after the colon', () => {
    const result = createErrorsFromMessage('Validation failed: email')

    expect(result).toEqual({ errors: ['email'], message: 'Validation failed: ' })
  })

  it('should split multiple comma-separated field errors after the colon', () => {
    const result = createErrorsFromMessage('The following fields are invalid: email, name')

    expect(result).toEqual({
      errors: ['email', 'name'],
      message: 'The following fields are invalid (2):',
    })
  })

  it('should preserve the full message when it contains multiple colons', () => {
    const result = createErrorsFromMessage('With: multiple: colons')

    expect(result).toEqual({ errors: ['multiple: colons'], message: 'With: ' })
  })

  it('should replace " > " with " → " in error paths', () => {
    const result = createErrorsFromMessage('Invalid: parent > child')

    expect(result).toEqual({ errors: ['parent → child'], message: 'Invalid: ' })
  })

  it('should group similar errors and count them', () => {
    const result = createErrorsFromMessage('Invalid: blocks > 0, blocks > 1, other')

    expect(result).toEqual({
      errors: ['blocks → 0', 'blocks → 1', 'other'],
      message: 'Invalid (3):',
    })
  })
})
