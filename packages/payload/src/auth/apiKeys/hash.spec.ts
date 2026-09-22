import { describe, expect, it } from 'vitest'

import { generateAPIKey, hashAPIKey } from './hash.js'

describe('hashAPIKey', () => {
  it('should return the same hash for the same key', () => {
    expect(hashAPIKey('my-api-key')).toStrictEqual(hashAPIKey('my-api-key'))
  })

  it('should return 64 hex characters', () => {
    expect(hashAPIKey('my-api-key')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('should return a different hash for a different key', () => {
    expect(hashAPIKey('my-api-key')).not.toStrictEqual(hashAPIKey('my-other-api-key'))
  })

  it('should not depend on any secret', () => {
    // The known SHA-256 of the string below. A change here means the derivation
    // changed and every stored key would stop authenticating.
    expect(hashAPIKey('payload')).toStrictEqual(
      '239f59ed55e737c77147cf55ad0c1b030b6d7ee748a7426952f9b852d5a935e5',
    )
  })
})

describe('generateAPIKey', () => {
  it('should return a url-safe key of at least 32 bytes of randomness', () => {
    const key = generateAPIKey()

    expect(key).toMatch(/^[\w-]+$/)
    expect(Buffer.from(key, 'base64url')).toHaveLength(32)
  })

  it('should not repeat', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateAPIKey()))

    expect(keys.size).toBe(100)
  })
})
