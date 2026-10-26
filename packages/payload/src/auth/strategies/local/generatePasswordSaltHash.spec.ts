import crypto from 'crypto'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { InvalidConfiguration } from '../../../errors/InvalidConfiguration.js'
import { generatePasswordSaltHash } from './generatePasswordSaltHash.js'

describe('generatePasswordSaltHash', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a 100k password hash when configured for 100000 iterations', async () => {
    const { hash, salt } = await generatePasswordSaltHash({
      collection: { slug: 'users' } as SanitizedCollectionConfig,
      isPasswordAuthenticated: true,
      password: 'test-password',
      req: {
        payload: { config: { auth: { passwordHashIterations: 100000 } } },
      } as PayloadRequest,
    })

    const expectedHash = crypto.pbkdf2Sync('test-password', salt, 100000, 32, 'sha256')

    expect(hash).toBe(`pbkdf2-sha256-100k-v1:${expectedHash.toString('hex')}`)
  })

  it('should throw an InvalidConfiguration error when the environment does not support the iterations', async () => {
    // Matches the error Cloudflare Workers throws for more than 100,000 iterations
    vi.spyOn(crypto, 'pbkdf2').mockImplementation(((...args: unknown[]) => {
      const callback = args.at(-1) as (err: Error) => void

      callback(
        new DOMException(
          'Pbkdf2 failed: iteration counts above 100000 are not supported (requested 600000).',
          'NotSupportedError',
        ),
      )
    }) as typeof crypto.pbkdf2)

    await expect(
      generatePasswordSaltHash({
        collection: { slug: 'users' } as SanitizedCollectionConfig,
        isPasswordAuthenticated: true,
        password: 'test-password',
        req: {
          payload: { config: { auth: { passwordHashIterations: 600000 } } },
        } as PayloadRequest,
      }),
    ).rejects.toThrow(InvalidConfiguration)
  })
})
