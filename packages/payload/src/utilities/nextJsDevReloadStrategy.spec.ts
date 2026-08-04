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

    /** Simulate a refused upgrade: the socket errors, then closes without ever opening. */
    failToConnect() {
      this.onerror?.()
      this.onclose?.()
    }

    /** Simulate Next.js announcing a server component change. */
    sendServerComponentChanges() {
      this.onmessage?.({ data: JSON.stringify({ type: 'serverComponentChanges' }) })
    }

    /** Simulate a successful upgrade. */
    succeedToConnect() {
      this.onopen?.()
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

  const urls = () => MockWebSocket.instances.map((instance) => instance.url)

  it('should connect only to the current HMR path on Next.js 16.3', () => {
    connect()

    expect(urls()).toStrictEqual([modernURL])
  })

  it('should connect only to the current HMR path on Next.js versions above 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('17.0.1')

    connect()

    expect(urls()).toStrictEqual([modernURL])
  })

  it('should connect only to the legacy HMR path on Next.js below 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.2.7')

    connect()

    expect(urls()).toStrictEqual([legacyURL])
  })

  it('should connect only to the legacy HMR path on a Next.js 15 install', () => {
    vi.mocked(getNextVersion).mockReturnValue('15.5.0')

    connect()

    expect(urls()).toStrictEqual([legacyURL])
  })

  // The rename landed partway through the 16.3.0 canary series, so no cutoff is correct
  // for every canary of that release. Race both rather than guess.
  it('should try both HMR paths on a canary of the version that renamed the path', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.3.0-canary.12')

    connect()

    expect(urls()).toStrictEqual([modernURL, legacyURL])
  })

  it('should connect only to the current HMR path on a canary above 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('17.0.0-canary.1')

    connect()

    expect(urls()).toStrictEqual([modernURL])
  })

  it('should connect only to the legacy HMR path on a canary below 16.3', () => {
    vi.mocked(getNextVersion).mockReturnValue('16.2.0-canary.5')

    connect()

    expect(urls()).toStrictEqual([legacyURL])
  })

  it('should try both HMR paths when the Next.js version is unknown', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)

    connect()

    expect(urls()).toStrictEqual([modernURL, legacyURL])
  })

  it('should close the losing socket once one of the raced paths opens', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)

    connect()

    MockWebSocket.instances[1]!.succeedToConnect()

    expect(MockWebSocket.instances[0]!.isClosed).toBe(true)
    expect(MockWebSocket.instances[1]!.isClosed).toBe(false)
  })

  it('should call onReload for server component changes', () => {
    const onReload = vi.fn()

    connect(onReload)

    MockWebSocket.instances[0]!.succeedToConnect()
    MockWebSocket.instances[0]!.sendServerComponentChanges()

    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('should ignore messages from a socket that lost the race', () => {
    const onReload = vi.fn()

    vi.mocked(getNextVersion).mockReturnValue(undefined)

    connect(onReload)

    MockWebSocket.instances[1]!.succeedToConnect()
    MockWebSocket.instances[0]!.sendServerComponentChanges()

    expect(onReload).not.toHaveBeenCalled()
  })

  it('should keep listening after a reconnect-worthy close of the open socket', () => {
    const onReload = vi.fn()

    connect(onReload)

    const socket = MockWebSocket.instances[0]!

    socket.succeedToConnect()
    socket.onclose?.()

    expect(urls()).toStrictEqual([modernURL])
  })

  it('should close every socket on cleanup', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)

    const strategy = defaultNextJsDevReloadStrategy()
    const cleanup = strategy!.connect(() => {})

    cleanup()

    expect(MockWebSocket.instances.map((instance) => instance.isClosed)).toStrictEqual([true, true])
  })

  it('should use PAYLOAD_HMR_URL_OVERRIDE on its own, whatever the version', () => {
    vi.mocked(getNextVersion).mockReturnValue(undefined)
    vi.stubEnv('PAYLOAD_HMR_URL_OVERRIDE', 'ws://localhost:4000/custom-hmr')

    connect()

    expect(urls()).toStrictEqual(['ws://localhost:4000/custom-hmr'])
  })

  it('should use the wss protocol when HTTPS is enabled', () => {
    vi.stubEnv('USE_HTTPS', 'true')

    connect()

    expect(urls()).toStrictEqual(['wss://localhost:3000/_next/hmr'])
  })
})
