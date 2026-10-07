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

const { defaultNextJsDevReloadStrategy } = await import('./nextJsDevReloadStrategy.js')

describe('defaultNextJsDevReloadStrategy', () => {
  const cleanups: (() => void)[] = []

  beforeEach(() => {
    MockWebSocket.instances.length = 0
    vi.stubEnv('PAYLOAD_HMR_URL_OVERRIDE', undefined)
    vi.stubEnv('PORT', '3000')
    vi.stubEnv('__NEXT_ASSET_PREFIX', undefined)
    vi.stubEnv('NEXT_BASE_PATH', undefined)
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

  it('should connect to the Next.js HMR path', () => {
    connect()

    expect(connectedURL()).toBe('ws://localhost:3000/_next/hmr')
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

  it('should use PAYLOAD_HMR_URL_OVERRIDE when set', () => {
    vi.stubEnv('PAYLOAD_HMR_URL_OVERRIDE', 'ws://localhost:4000/custom-hmr')

    connect()

    expect(connectedURL()).toBe('ws://localhost:4000/custom-hmr')
  })

  it('should use the wss protocol when HTTPS is enabled', () => {
    vi.stubEnv('USE_HTTPS', 'true')

    connect()

    expect(connectedURL()).toBe('wss://localhost:3000/_next/hmr')
  })

  it('should prefix the HMR path with the basePath when no assetPrefix is available', () => {
    vi.stubEnv('NEXT_BASE_PATH', '/cms')

    connect()

    expect(connectedURL()).toBe('ws://localhost:3000/cms/_next/hmr')
  })

  it('should prefer the assetPrefix over the basePath', () => {
    vi.stubEnv('__NEXT_ASSET_PREFIX', '/assets')
    vi.stubEnv('NEXT_BASE_PATH', '/cms')

    connect()

    expect(connectedURL()).toBe('ws://localhost:3000/assets/_next/hmr')
  })
})
