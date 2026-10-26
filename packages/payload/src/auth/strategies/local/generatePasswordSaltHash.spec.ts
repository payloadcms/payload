import crypto from 'crypto'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { InvalidConfiguration } from '../../../errors/InvalidConfiguration.js'
import { generatePasswordSaltHash, getPasswordHashParameters } from './generatePasswordSaltHash.js'

const collection = { slug: 'users' } as SanitizedCollectionConfig

const createReq = (passwordHashIterations: 100000 | 600000): PayloadRequest =>
  ({ payload: { config: { auth: { passwordHashIterations } } } }) as PayloadRequest

const mockPBKDF2Error = (error: Error): void => {
  vi.spyOn(crypto, 'pbkdf2').mockImplementation(((...args: unknown[]) => {
    const callback = args.at(-1) as (err: Error) => void

    callback(error)
  }) as typeof crypto.pbkdf2)
}

describe('generatePasswordSaltHash', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a v1 hash with 600000 iterations', async () => {
    const { hash, salt } = await generatePasswordSaltHash({
      collection,
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: createReq(600000),
    })

    const expectedHash = crypto.pbkdf2Sync('test-password', salt, 600000, 32, 'sha256')

    expect(hash).toBe(`pbkdf2-sha256-v1:${expectedHash.toString('hex')}`)
  })

  it('should create a 100k hash with 100000 iterations', async () => {
    const { hash, salt } = await generatePasswordSaltHash({
      collection,
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: createReq(100000),
    })

    const expectedHash = crypto.pbkdf2Sync('test-password', salt, 100000, 32, 'sha256')

    expect(hash).toBe(`pbkdf2-sha256-100k-v1:${expectedHash.toString('hex')}`)
  })

  it('should throw an InvalidConfiguration error when the environment does not support the iterations', async () => {
    // Matches the error Cloudflare Workers throws for more than 100,000 iterations
    mockPBKDF2Error(
      new DOMException(
        'Pbkdf2 failed: iteration counts above 100000 are not supported (requested 600000).',
        'NotSupportedError',
      ),
    )

    await expect(
      generatePasswordSaltHash({
        collection,
        isPasswordAuthenticated: true,
        password: 'test-password',
        req: createReq(600000),
      }),
    ).rejects.toThrow(InvalidConfiguration)
  })

  it('should rethrow other hashing errors', async () => {
    const error = new Error('Unexpected failure')

    mockPBKDF2Error(error)

    await expect(
      generatePasswordSaltHash({
        collection,
        isPasswordAuthenticated: true,
        password: 'test-password',
        req: createReq(600000),
      }),
    ).rejects.toBe(error)
  })
})

describe('getPasswordHashParameters', () => {
  it('should read 600000 iterations from a v1 hash', () => {
    expect(getPasswordHashParameters('pbkdf2-sha256-v1:deadbeef')).toEqual({
      hash: 'deadbeef',
      iterations: 600000,
      keyLength: 32,
    })
  })

  it('should read 100000 iterations from a 100k hash', () => {
    expect(getPasswordHashParameters('pbkdf2-sha256-100k-v1:deadbeef')).toEqual({
      hash: 'deadbeef',
      iterations: 100000,
      keyLength: 32,
    })
  })

  it('should use legacy parameters for a hash without a prefix', () => {
    expect(getPasswordHashParameters('deadbeef')).toEqual({
      hash: 'deadbeef',
      iterations: 25000,
      keyLength: 512,
    })
  })
})
