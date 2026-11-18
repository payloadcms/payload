import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loadEnvConfig } = vi.hoisted(() => ({
  loadEnvConfig: vi.fn(() => ({ loadedEnvFiles: [] })),
}))

describe('loadEnv', () => {
  beforeEach(() => {
    vi.doUnmock('@next/env')
    vi.resetModules()
    loadEnvConfig.mockClear()
  })

  // next@16 bundles @next/env with named exports and no `default`.
  it('loads env config when @next/env exposes named exports only', async () => {
    vi.doMock('@next/env', () => ({ loadEnvConfig }))

    const { loadEnv } = await import('./loadEnv.js')
    loadEnv('/tmp/payload-load-env-named')

    expect(loadEnvConfig).toHaveBeenCalledWith('/tmp/payload-load-env-named', true)
  })

  // next@15 resolves @next/env as CommonJS, where everything is under `default`.
  it('loads env config when @next/env exposes only a CJS default', async () => {
    vi.doMock('@next/env', () => ({ default: { loadEnvConfig } }))

    const { loadEnv } = await import('./loadEnv.js')
    loadEnv('/tmp/payload-load-env-default')

    expect(loadEnvConfig).toHaveBeenCalledWith('/tmp/payload-load-env-default', true)
  })
})
