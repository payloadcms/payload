import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

const withIterations = (iterations: number): SanitizedCollectionConfig =>
  ({ slug: 'users', auth: { passwordHashing: { iterations } } }) as SanitizedCollectionConfig

describe('generatePasswordSaltHash', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('should embed 600000 iterations in hashes generated in Node.js', async () => {
    const { generatePasswordSaltHash, getPasswordHashParameters } = await import(
      './generatePasswordSaltHash.js'
    )

    const { hash } = await generatePasswordSaltHash({
      collection: { slug: 'users' } as SanitizedCollectionConfig,
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: {} as PayloadRequest,
    })

    expect(hash).toMatch(/^pbkdf2-sha256-v2-i600000-l32:[0-9a-f]{64}$/)
    expect(getPasswordHashParameters(hash)).toMatchObject({ iterations: 600000, keyLength: 32 })
  })

  it('should cap embedded iterations at 100000 on Cloudflare Workers', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' })
    const { generatePasswordSaltHash, getPasswordHashParameters } = await import(
      './generatePasswordSaltHash.js'
    )

    const { hash } = await generatePasswordSaltHash({
      collection: { slug: 'users' } as SanitizedCollectionConfig,
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: {} as PayloadRequest,
    })

    expect(hash).toMatch(/^pbkdf2-sha256-v2-i100000-l32:[0-9a-f]{64}$/)
    expect(getPasswordHashParameters(hash)).toMatchObject({ iterations: 100000, keyLength: 32 })
  })

  it('should verify a Workers-created hash with its embedded parameters in Node.js', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' })
    const workersModule = await import('./generatePasswordSaltHash.js')
    const { hash } = await workersModule.generatePasswordSaltHash({
      collection: { slug: 'users' } as SanitizedCollectionConfig,
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: {} as PayloadRequest,
    })

    // Back in Node.js: verification must use the parameters from the hash,
    // not the runtime default.
    vi.unstubAllGlobals()
    vi.resetModules()
    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    expect(getPasswordHashParameters(hash)).toMatchObject({ iterations: 100000, keyLength: 32 })
  })

  it('should read iterations and key length from a v2 hash', async () => {
    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    expect(getPasswordHashParameters('pbkdf2-sha256-v2-i100000-l32:deadbeef')).toEqual({
      hash: 'deadbeef',
      iterations: 100000,
      keyLength: 32,
    })
  })

  it('should verify v1 hashes with the original 600000 iterations', async () => {
    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    expect(getPasswordHashParameters('pbkdf2-sha256-v1:deadbeef')).toEqual({
      hash: 'deadbeef',
      iterations: 600000,
      keyLength: 32,
    })
  })

  it('should fall back to legacy parameters for unprefixed hashes', async () => {
    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    expect(getPasswordHashParameters('deadbeef')).toEqual({
      hash: 'deadbeef',
      iterations: 25000,
      keyLength: 512,
    })
  })

  it('should fall back to legacy parameters for malformed v2 hashes', async () => {
    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    expect(getPasswordHashParameters('pbkdf2-sha256-v2-i100000-l32')).toEqual({
      hash: 'pbkdf2-sha256-v2-i100000-l32',
      iterations: 25000,
      keyLength: 512,
    })
  })

  it('should embed the configured iterations in Node.js', async () => {
    const { generatePasswordSaltHash, getPasswordHashParameters } = await import(
      './generatePasswordSaltHash.js'
    )

    const { hash } = await generatePasswordSaltHash({
      collection: withIterations(100000),
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: {} as PayloadRequest,
    })

    expect(getPasswordHashParameters(hash)).toMatchObject({ iterations: 100000, keyLength: 32 })
  })

  it('should prefer the configured iterations over the Workers default', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' })
    const { generatePasswordSaltHash, getPasswordHashParameters } = await import(
      './generatePasswordSaltHash.js'
    )

    const { hash } = await generatePasswordSaltHash({
      collection: withIterations(50000),
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: {} as PayloadRequest,
    })

    expect(getPasswordHashParameters(hash)).toMatchObject({ iterations: 50000 })
  })

  it('should resolve the target iterations from config, then the runtime', async () => {
    const { getTargetPasswordHashIterations } = await import('./generatePasswordSaltHash.js')

    expect(getTargetPasswordHashIterations({ slug: 'users' } as SanitizedCollectionConfig)).toBe(
      600000,
    )
    expect(getTargetPasswordHashIterations(withIterations(200000))).toBe(200000)

    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' })

    expect(getTargetPasswordHashIterations({ slug: 'users' } as SanitizedCollectionConfig)).toBe(
      100000,
    )
    expect(getTargetPasswordHashIterations(withIterations(200000))).toBe(200000)
  })

  describe('shouldUpdatePasswordHash', () => {
    it('should migrate legacy and v1 hashes regardless of config', async () => {
      const { shouldUpdatePasswordHash } = await import('./generatePasswordSaltHash.js')

      for (const collection of [undefined, withIterations(100000)]) {
        expect(shouldUpdatePasswordHash({ collection, hash: 'deadbeef' })).toBe(true)
        expect(shouldUpdatePasswordHash({ collection, hash: 'pbkdf2-sha256-v1:deadbeef' })).toBe(
          true,
        )
      }
    })

    it('should keep v2 hashes as they are when iterations are not configured', async () => {
      // Without a configured value the target depends on the runtime, so a
      // login from Node.js must not rehash a Workers-created hash to 600000
      // and lock that user out on Workers.
      const { shouldUpdatePasswordHash } = await import('./generatePasswordSaltHash.js')

      expect(
        shouldUpdatePasswordHash({
          collection: { slug: 'users' } as SanitizedCollectionConfig,
          hash: 'pbkdf2-sha256-v2-i100000-l32:deadbeef',
        }),
      ).toBe(false)
    })

    it('should rehash v2 hashes whose iterations differ from the configured value', async () => {
      const { shouldUpdatePasswordHash } = await import('./generatePasswordSaltHash.js')
      const collection = withIterations(300000)

      expect(
        shouldUpdatePasswordHash({ collection, hash: 'pbkdf2-sha256-v2-i100000-l32:deadbeef' }),
      ).toBe(true)
      expect(
        shouldUpdatePasswordHash({ collection, hash: 'pbkdf2-sha256-v2-i600000-l32:deadbeef' }),
      ).toBe(true)
      expect(
        shouldUpdatePasswordHash({ collection, hash: 'pbkdf2-sha256-v2-i300000-l32:deadbeef' }),
      ).toBe(false)
    })
  })

  it('should treat only v2 hashes as current so older hashes migrate on login', async () => {
    const { isCurrentPasswordHash } = await import('./generatePasswordSaltHash.js')

    expect(isCurrentPasswordHash('pbkdf2-sha256-v2-i100000-l32:deadbeef')).toBe(true)
    expect(isCurrentPasswordHash('pbkdf2-sha256-v1:deadbeef')).toBe(false)
    expect(isCurrentPasswordHash('deadbeef')).toBe(false)
    expect(isCurrentPasswordHash(undefined)).toBe(false)
  })
})
