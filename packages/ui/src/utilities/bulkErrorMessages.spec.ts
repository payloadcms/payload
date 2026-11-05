import { describe, expect, it } from 'vitest'

import {
  formatBulkErrorDescription,
  getBulkErrorMessages,
  readBulkErrorToast,
} from './bulkErrorMessages.js'

describe('getBulkErrorMessages', () => {
  it('should return an empty list when there are no errors', () => {
    expect(getBulkErrorMessages({ errors: undefined })).toEqual([])
    expect(getBulkErrorMessages({ errors: null })).toEqual([])
    expect(getBulkErrorMessages({ errors: [] })).toEqual([])
  })

  it('should keep the first unique message for each distinct reason', () => {
    const messages = getBulkErrorMessages({
      errors: [
        { id: 'a', isPublic: true, message: "You can't edit this page." },
        { id: 'b', isPublic: true, message: "You can't edit this page." },
        { id: 'c', isPublic: true, message: 'The following field is invalid: title' },
      ],
    })

    expect(messages).toEqual(["You can't edit this page.", 'The following field is invalid: title'])
  })

  it('should skip blank messages and values that are not strings', () => {
    const messages = getBulkErrorMessages({
      errors: [
        { message: '   ' },
        { message: '' },
        { message: null },
        { message: undefined },
        {},
        null,
        { message: 'Locked by another user.' },
      ],
    })

    expect(messages).toEqual(['Locked by another user.'])
  })

  it('should show the sanitized message the API already returned for a non-public error, once', () => {
    const messages = getBulkErrorMessages({
      errors: [
        { id: 'a', isPublic: false, message: 'Something went wrong.' },
        { id: 'b', isPublic: false, message: 'Something went wrong.' },
        { id: 'c', isPublic: true, message: "You can't edit this page." },
      ],
    })

    expect(messages).toEqual(['Something went wrong.', "You can't edit this page."])
  })
})

describe('formatBulkErrorDescription', () => {
  it('should join unique reasons with newlines', () => {
    const description = formatBulkErrorDescription({
      errors: [
        { isPublic: true, message: "You can't edit this page." },
        { isPublic: true, message: "You can't edit this page." },
        { isPublic: true, message: 'Missing required field.' },
      ],
    })

    expect(description).toBe("You can't edit this page.\nMissing required field.")
  })

  it('should return undefined when there is nothing to show', () => {
    expect(formatBulkErrorDescription({ errors: [] })).toBeUndefined()
    expect(formatBulkErrorDescription({ errors: [{ message: '  ' }] })).toBeUndefined()
  })
})

describe('readBulkErrorToast', () => {
  it('should read a headline and its reasons', () => {
    expect(
      readBulkErrorToast({
        description: "You can't edit this page.",
        message: 'Unable to update 2 out of 2 Pages.',
      }),
    ).toEqual({
      description: "You can't edit this page.",
      message: 'Unable to update 2 out of 2 Pages.',
    })
  })

  it('should ignore strings and react elements so those toasts stay as they are', () => {
    expect(readBulkErrorToast('Unable to update 2 out of 2 Pages.')).toBeNull()
    expect(
      readBulkErrorToast({ $$typeof: Symbol.for('react.element'), message: 'nope' }),
    ).toBeNull()
    expect(readBulkErrorToast({ message: '' })).toBeNull()
  })
})
