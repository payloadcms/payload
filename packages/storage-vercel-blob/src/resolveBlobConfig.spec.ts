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

  it('trims surrounding whitespace, with or without the prefix', () => {
    expect(normalizeStoreId('  abc123 ')).toBe('abc123')
    expect(normalizeStoreId(' store_abc123\n')).toBe('abc123')
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

    it('trims whitespace so the base url matches the store the SDK authenticates', () => {
      const fromOption = resolveBlobConfig({ access: 'public', storeId: ' store_abc ' })
      expect(fromOption.storeId).toBe('abc')
      expect(fromOption.baseUrl).toBe('https://abc.public.blob.vercel-storage.com')

      const fromEnv = resolveBlobConfig({ access: 'public', envStoreId: '\tstore_def\n' })
      expect(fromEnv.storeId).toBe('def')
      expect(fromEnv.baseUrl).toBe('https://def.public.blob.vercel-storage.com')
    })

    it('treats a blank storeId option as unset and falls back to BLOB_STORE_ID', () => {
      const result = resolveBlobConfig({
        access: 'public',
        envStoreId: 'store_fromenv',
        storeId: '   ',
      })
      expect(result.isPluginDisabled).toBe(false)
      expect(result.storeId).toBe('fromenv')
    })

    it('is disabled when every store id source is blank', () => {
      const result = resolveBlobConfig({ access: 'public', envStoreId: '  ', storeId: ' ' })
      expect(result.isPluginDisabled).toBe(true)
      expect(result.storeId).toBeUndefined()
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

    it('does not throw for a malformed token when the plugin is explicitly disabled', () => {
      expect(() =>
        resolveBlobConfig({ access: 'public', enabled: false, token: 'garbage' }),
      ).not.toThrow()
    })

    it('throws for a malformed token even when no store id resolves (does not silently disable)', () => {
      // A typo'd BLOB_READ_WRITE_TOKEN leaves no resolvable store id, which
      // would otherwise mark the plugin disabled and hide the misconfiguration.
      // It must fail loudly whenever the plugin is not explicitly disabled.
      expect(() => resolveBlobConfig({ access: 'public', token: 'garbage' })).toThrow(
        /Invalid token format/,
      )
    })
  })

  describe('base url override (emulator)', () => {
    it('does not enable the plugin on the override alone (no store id, no credentials)', () => {
      // The override only redirects blob URLs; without a store id the SDK
      // cannot authenticate, so the plugin must fall back to local storage.
      const result = resolveBlobConfig({
        access: 'public',
        envBaseUrl: 'http://localhost:9966',
      })
      expect(result.isPluginDisabled).toBe(true)
      expect(result.storeId).toBeUndefined()
    })

    it('stays enabled with the emulator-style token and the override', () => {
      // The vercel-blob-emulator is documented with a vercel_blob_rw_<id>_<x> token.
      const result = resolveBlobConfig({
        access: 'public',
        envBaseUrl: 'http://localhost:3100',
        token: 'vercel_blob_rw_emulator_local',
      })
      expect(result.isPluginDisabled).toBe(false)
      expect(result.storeId).toBe('emulator')
      expect(result.baseUrl).toBe('http://localhost:3100')
    })

    it('stays enabled with the override and a store id in OIDC mode', () => {
      const result = resolveBlobConfig({
        access: 'public',
        envBaseUrl: 'http://localhost:3100',
        storeId: 'store_oidc1',
      })
      expect(result.isPluginDisabled).toBe(false)
      expect(result.baseUrl).toBe('http://localhost:3100')
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
