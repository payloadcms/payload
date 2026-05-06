import { describe, expect, it } from 'vitest'

import type { Config } from './types.js'

import { sanitizeConfig } from './sanitize.js'

/**
 * Tests for the `admin.serverFunctions` registry added to the Config surface.
 *
 * The lookup-order behavior in `handleServerFunctions` is intentionally NOT tested
 * here because that handler depends on the full Next.js / payload runtime stack
 * (`initReq`, `getPayload`, request headers). Those code paths are exercised by
 * the e2e suite in `test/server-functions/`. This file only covers the new
 * sanitize-time validation and defaulting that lives in `sanitizeAdminConfig`.
 */
describe('admin.serverFunctions registry — sanitize', () => {
  const minimalConfig = (): Config =>
    // Cast: a fully-typed Config requires fields we don't care about for these tests.
    ({
      collections: [],
    }) as unknown as Config

  it('defaults `admin.serverFunctions` to an empty object when not provided', async () => {
    const sanitized = await sanitizeConfig(minimalConfig())

    expect(sanitized.admin?.serverFunctions).toBeDefined()
    expect(sanitized.admin?.serverFunctions).toEqual({})
  })

  it('preserves user-supplied server functions on the sanitized config', async () => {
    const handler = async () => 'ok'
    const config = minimalConfig()
    config.admin = {
      serverFunctions: {
        '@my-plugin/foo': handler,
      },
    }

    const sanitized = await sanitizeConfig(config)

    expect(sanitized.admin?.serverFunctions?.['@my-plugin/foo']).toBe(handler)
  })

  it('throws when a server function value is not a function', async () => {
    const config = minimalConfig()
    config.admin = {
      // @ts-expect-error — intentionally invalid
      serverFunctions: { 'bad/key': 'not a function' },
    }

    await expect(sanitizeConfig(config)).rejects.toThrow(/admin\.serverFunctions\["bad\/key"\]/)
  })

  it('throws when a server function key is an empty string', async () => {
    const config = minimalConfig()
    config.admin = {
      serverFunctions: {
        '': async () => 'ok',
      },
    }

    await expect(sanitizeConfig(config)).rejects.toThrow(
      /admin\.serverFunctions: keys must be non-empty strings/,
    )
  })
})
