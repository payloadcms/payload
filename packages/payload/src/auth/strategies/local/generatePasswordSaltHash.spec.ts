import { afterEach, describe, expect, it, vi } from 'vitest'

describe('generatePasswordSaltHash', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('should use 600000 iterations in Node.js', async () => {
    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    const { iterations } = getPasswordHashParameters('pbkdf2-sha256-v1:hash')

    expect(iterations).toBe(600000)
  })

  it('should cap iterations at 100000 on Cloudflare Workers', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' })

    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    const { iterations } = getPasswordHashParameters('pbkdf2-sha256-v1:hash')

    expect(iterations).toBeLessThanOrEqual(100000)
  })

  it('should still use 600000 iterations in other runtimes that define navigator', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Node.js/v24.20.0' })

    const { getPasswordHashParameters } = await import('./generatePasswordSaltHash.js')

    const { iterations } = getPasswordHashParameters('pbkdf2-sha256-v1:hash')

    expect(iterations).toBe(600000)
  })
})
