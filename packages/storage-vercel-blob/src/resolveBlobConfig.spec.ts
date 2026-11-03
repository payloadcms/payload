import { describe, expect, it } from 'vitest'

import { normalizeStoreId, parseStoreIdFromToken, resolveBlobConfig } from './resolveBlobConfig.js'

const RW_TOKEN = 'vercel_blob_rw_abc123store_randomsecret'

describe('normalizeStoreId', () => {
  it('strips the store_ prefix', () => {
    expect(normalizeStoreId('store_abc123')).toBe('abc123')
  })

  it('leaves an unprefixed id unchanged', () => {
    expect(normalizeStoreId('abc123')).toBe('abc123')
  })
})

describe('parseStoreIdFromToken', () => {
  it('extracts the lowercased store id from a read/write token', () => {
    expect(parseStoreIdFromToken('vercel_blob_rw_ABC123_secret')).toBe('abc123')
  })

  it('returns undefined for a malformed token', () => {
    expect(parseStoreIdFromToken('not-a-token')).toBeUndefined()
    expect(parseStoreIdFromToken('')).toBeUndefined()
  })
})

describe('resolveBlobConfig', () => {
  describe('read/write token mode', () => {
    it('derives the store id and base url from the token', () => {
      const result = resolveBlobConfig({ access: 'public', token: RW_TOKEN })
      expect(result.isPluginDisabled).toBe(false)
      expect(result.storeId).toBe('abc123store')
      expect(result.baseUrl).toBe('https://abc123store.public.blob.vercel-storage.com')
    })

    it('throws for a malformed token when the plugin is active', () => {
      expect(() =>
        resolveBlobConfig({ access: 'public', token: 'garbage', envStoreId: 'abc' }),
      ).toThrow(/Invalid token format/)
    })
  })

  describe('OIDC mode (no token)', () => {
    it('stays enabled and builds the base url from the explicit storeId option', () => {
      const result = resolveBlobConfig({ access: 'public', storeId: 'store_oidc1' })
      expect(result.isPluginDisabled).toBe(false)
      expect(result.storeId).toBe('oidc1')
      expect(result.baseUrl).toBe('https://oidc1.public.blob.vercel-storage.com')
    })

    it('falls back to the BLOB_STORE_ID environment variable', () => {
      const result = resolveBlobConfig({ access: 'public', envStoreId: 'store_fromenv' })
      expect(result.isPluginDisabled).toBe(false)
      expect(result.storeId).toBe('fromenv')
      expect(result.baseUrl).toBe('https://fromenv.public.blob.vercel-storage.com')
    })

    it('prefers the explicit storeId option over BLOB_STORE_ID', () => {
      const result = resolveBlobConfig({
        access: 'public',
        envStoreId: 'store_fromenv',
        storeId: 'store_explicit',
      })
      expect(result.storeId).toBe('explicit')
    })
  })

  describe('disabled states', () => {
    it('is disabled when neither a token nor a store id can be resolved', () => {
      const result = resolveBlobConfig({ access: 'public' })
      expect(result.isPluginDisabled).toBe(true)
    })

    it('is disabled when enabled is explicitly false, even with a token', () => {
      const result = resolveBlobConfig({ access: 'public', enabled: false, token: RW_TOKEN })
      expect(result.isPluginDisabled).toBe(true)
    })

    it('does not throw for a malformed token when the plugin ends up disabled', () => {
      expect(() =>
        resolveBlobConfig({ access: 'public', enabled: false, token: 'garbage' }),
      ).not.toThrow()
    })
  })

  describe('base url override (emulator)', () => {
    it('stays enabled on the override alone, with no store id', () => {
      const result = resolveBlobConfig({
        access: 'public',
        envBaseUrl: 'http://localhost:9966',
      })
      expect(result.isPluginDisabled).toBe(false)
      expect(result.storeId).toBeUndefined()
      expect(result.baseUrl).toBe('http://localhost:9966')
    })

    it('the override wins over a token-derived base url', () => {
      const result = resolveBlobConfig({
        access: 'public',
        envBaseUrl: 'http://localhost:9966',
        token: RW_TOKEN,
      })
      expect(result.baseUrl).toBe('http://localhost:9966')
      expect(result.storeId).toBe('abc123store')
    })
  })
})
