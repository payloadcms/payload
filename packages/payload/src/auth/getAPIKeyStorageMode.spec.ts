import { describe, expect, it } from 'vitest'

import { getAPIKeyStorageMode } from './getAPIKeyStorageMode.js'

describe('getAPIKeyStorageMode', () => {
  it('should return false when useAPIKey is not set', () => {
    expect(getAPIKeyStorageMode(undefined)).toBe(false)
    expect(getAPIKeyStorageMode({ useAPIKey: false })).toBe(false)
  })

  it('should return false for the bare auth: true collection shorthand', () => {
    expect(getAPIKeyStorageMode(true)).toBe(false)
  })

  it('should return collection when useAPIKey is true', () => {
    expect(getAPIKeyStorageMode({ useAPIKey: true })).toBe('collection')
  })

  it('should return collection when useAPIKey is configured with an access override', () => {
    expect(getAPIKeyStorageMode({ useAPIKey: { access: { manageOthers: () => true } } })).toBe(
      'collection',
    )
  })
})
