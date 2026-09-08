import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { MockWebSocket } = vi.hoisted(() => {
  class MockWebSocket {
    static instances: MockWebSocket[] = []

    isClosed = false

    onclose: (() => void) | null = null

    onerror: (() => void) | null = null

    onmessage: ((event: { data: unknown }) => void) | null = null

    onopen: (() => void) | null = null

    url: string

    constructor(url: string) {
      this.url = url
      MockWebSocket.instances.push(this)
    }

    close() {
      this.isClosed = true
    }

    /** Simulate Next.js announcing a server component change. */
    sendServerComponentChanges() {
      this.onmessage?.({ data: JSON.stringify({ type: 'serverComponentChanges' }) })
    }
  }

  return { MockWebSocket }
})

vi.mock('ws', () => ({ default: MockWebSocket }))
vi.mock('./getNextVersion.js', () => ({ getNextVersion: vi.fn() }))

const { getNextVersion } = await import('./getNextVersion.js')
const { defaultNextJsDevReloadStrategy } = await import('./nextJsDevReloadStrategy.js')

const modernURL = 'ws://localhost:3000/_next/hmr'
const legacyURL = 'ws://localhost:3000/_next/webpack-hmr'

describe('defaultNextJsDevReloadStrategy', () => {
  const cleanups: (() => void)[] = []

  beforeEach(() => {
    MockWebSocket.instances.length = 0
    vi.mocked(getNextVersion).mockReturnValue('16.3.0')
    vi.stubEnv('PAYLOAD_HMR_URL_OVERRIDE', undefined)
    vi.stubEnv('PORT', '3000')
  })

  afterEach(() => {
    for (const cleanup of cleanups) {
      cleanup()
    }

    cleanups.length = 0
    vi.unstubAllEnvs()
  })

  const connect = (onReload: () => void = () => {}) => {
    const strategy = defaultNextJsDevReloadStrategy()

    expect(strategy).not.toBeNull()

    cleanups.push(strategy!.connect(onReload))
  }

  const connectedURL = () => {
    expect(MockWebSocket.instances).toHaveLength(1)

    return MockWebSocket.instances[0]!.url
  }

  it('should connect to the current HMR path on Next.js 16.3', () => {
    connect()

    expect(connectedURL()).toBe(modernURL)
  })

  it('should connect to the current HMR path on Next.js versions above 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('17.0.1')

    connect()

    expect(connectedURL()).toBe(modernURL)
  })

  it('should connect to the legacy HMR path on Next.js below 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.2.7')

    connect()

    expect(connectedURL()).toBe(legacyURL)
  })

  it('should connect to the legacy HMR path on a Next.js 15 install', () => {
    vi.mocked(getNextVersion).mockReturnValue('15.5.0')

    connect()

    expect(connectedURL()).toBe(legacyURL)
  })

  it('should ignore pre-release identifiers when choosing the path', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.3.0-canary.12')

    connect()

    expect(connectedURL()).toBe(modernURL)
  })

  it('should connect to the legacy HMR path on a pre-release below 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.2.0-canary.5')

    connect()

    expect(connectedURL()).toBe(legacyURL)
  })

  it('should connect to the current HMR path when the Next.js version is unknown', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)

    connect()

    expect(connectedURL()).toBe(modernURL)
  })

  it('should call onReload for server component changes', () => {
    const onReload = vi.fn()

    connect(onReload)

    MockWebSocket.instances[0]!.sendServerComponentChanges()

    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('should close the socket on cleanup', () => {
    const strategy = defaultNextJsDevReloadStrategy()
    const cleanup = strategy!.connect(() => {})

    cleanup()

    expect(MockWebSocket.instances[0]!.isClosed).toBe(true)
  })

  it('should use PAYLOAD_HMR_URL_OVERRIDE whatever the version', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)
    vi.stubEnv('PAYLOAD_HMR_URL_OVERRIDE', 'ws://localhost:4000/custom-hmr')

    connect()

    expect(connectedURL()).toBe('ws://localhost:4000/custom-hmr')
  })

  it('should use the wss protocol when HTTPS is enabled', () => {
    vi.stubEnv('USE_HTTPS', 'true')

    connect()

    expect(connectedURL()).toBe('wss://localhost:3000/_next/hmr')
  })
})
