import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

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

  it('should treat only v2 hashes as current so older hashes migrate on login', async () => {
    const { isCurrentPasswordHash } = await import('./generatePasswordSaltHash.js')

    expect(isCurrentPasswordHash('pbkdf2-sha256-v2-i100000-l32:deadbeef')).toBe(true)
    expect(isCurrentPasswordHash('pbkdf2-sha256-v1:deadbeef')).toBe(false)
    expect(isCurrentPasswordHash('deadbeef')).toBe(false)
    expect(isCurrentPasswordHash(undefined)).toBe(false)
  })
})
