import { describe, expect, it } from 'vitest'

import {
  readDataStatus,
  resolveRequestedStatusAfterBeforeOperation,
} from './resolveRequestedStatusAfterBeforeOperation.js'

describe('resolveRequestedStatusAfterBeforeOperation', () => {
  it('should keep the pre-hook capture when the caller requested a status', () => {
    const result = resolveRequestedStatusAfterBeforeOperation({
      hasRequestedStatus: true,
      requestedStatus: 'draft',
      statusAfterOperation: 'published',
      statusBeforeOperation: 'draft',
    })

    expect(result).toEqual({
      hasRequestedStatus: true,
      requestedStatus: 'draft',
    })
  })

  it('should honor a published status that beforeOperation introduces', () => {
    const result = resolveRequestedStatusAfterBeforeOperation({
      hasRequestedStatus: false,
      requestedStatus: undefined,
      statusAfterOperation: 'published',
      statusBeforeOperation: undefined,
    })

    expect(result).toEqual({
      hasRequestedStatus: true,
      requestedStatus: 'published',
    })
  })

  it('should honor a draft status that beforeOperation introduces', () => {
    const result = resolveRequestedStatusAfterBeforeOperation({
      hasRequestedStatus: false,
      requestedStatus: undefined,
      statusAfterOperation: 'draft',
      statusBeforeOperation: undefined,
    })

    expect(result).toEqual({
      hasRequestedStatus: true,
      requestedStatus: 'draft',
    })
  })

  it('should ignore a generated published status that beforeOperation leaves unchanged', () => {
    const result = resolveRequestedStatusAfterBeforeOperation({
      hasRequestedStatus: false,
      requestedStatus: undefined,
      statusAfterOperation: 'published',
      statusBeforeOperation: 'published',
    })

    expect(result).toEqual({
      hasRequestedStatus: false,
      requestedStatus: undefined,
    })
  })

  it('should honor a hook that replaces a generated published status with draft', () => {
    const result = resolveRequestedStatusAfterBeforeOperation({
      hasRequestedStatus: false,
      requestedStatus: undefined,
      statusAfterOperation: 'draft',
      statusBeforeOperation: 'published',
    })

    expect(result).toEqual({
      hasRequestedStatus: true,
      requestedStatus: 'draft',
    })
  })
})

describe('readDataStatus', () => {
  it('should read an own _status property', () => {
    expect(readDataStatus({ _status: 'published' })).toBe('published')
  })

  it('should return undefined when _status is absent', () => {
    expect(readDataStatus({ deletedAt: null })).toBeUndefined()
    expect(readDataStatus(null)).toBeUndefined()
  })
})
