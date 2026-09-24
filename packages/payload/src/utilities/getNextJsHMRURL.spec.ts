import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./getNextVersion.js', () => ({ getNextVersion: vi.fn() }))

const { getNextVersion } = await import('./getNextVersion.js')
const { getNextJsHMRURL } = await import('./getNextJsHMRURL.js')

const modernURL = 'ws://localhost:3000/_next/hmr'
const legacyURL = 'ws://localhost:3000/_next/webpack-hmr'

describe('getNextJsHMRURL', () => {
  beforeEach(() => {
    vi.mocked(getNextVersion).mockReturnValue('16.3.0')
    vi.stubEnv('PAYLOAD_HMR_URL_OVERRIDE', undefined)
    vi.stubEnv('PORT', '3000')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should use the current HMR path on Next.js 16.3', () => {
    expect(getNextJsHMRURL()).toBe(modernURL)
  })

  it('should use the current HMR path on Next.js versions above 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('17.0.1')

    expect(getNextJsHMRURL()).toBe(modernURL)
  })

  it('should use the legacy HMR path on Next.js below 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.2.7')

    expect(getNextJsHMRURL()).toBe(legacyURL)
  })

  it('should use the legacy HMR path on a Next.js 15 install', () => {
    vi.mocked(getNextVersion).mockReturnValue('15.5.0')

    expect(getNextJsHMRURL()).toBe(legacyURL)
  })

  it('should ignore pre-release identifiers when choosing the path', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.3.0-canary.12')

    expect(getNextJsHMRURL()).toBe(modernURL)
  })

  it('should use the legacy HMR path on a pre-release below 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.2.0-canary.5')

    expect(getNextJsHMRURL()).toBe(legacyURL)
  })

  it('should use the current HMR path when the Next.js version is unknown', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)

    expect(getNextJsHMRURL()).toBe(modernURL)
  })

  it('should use PAYLOAD_HMR_URL_OVERRIDE whatever the version', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)
    vi.stubEnv('PAYLOAD_HMR_URL_OVERRIDE', 'ws://localhost:4000/custom-hmr')

    expect(getNextJsHMRURL()).toBe('ws://localhost:4000/custom-hmr')
  })

  it('should use the wss protocol when HTTPS is enabled', () => {
    vi.stubEnv('USE_HTTPS', 'true')

    expect(getNextJsHMRURL()).toBe('wss://localhost:3000/_next/hmr')
  })

  it('should include the Next.js asset prefix', () => {
    vi.stubEnv('__NEXT_ASSET_PREFIX', '/base')

    expect(getNextJsHMRURL()).toBe('ws://localhost:3000/base/_next/hmr')
  })
})
