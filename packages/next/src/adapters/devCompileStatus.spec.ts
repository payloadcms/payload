import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { connectDevCompileStatus } from './devCompileStatus.js'

class MockWebSocket {
  static instances: MockWebSocket[] = []

  close = vi.fn()
  onerror: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  url: string

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }
}

describe('connectDevCompileStatus', () => {
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    MockWebSocket.instances = []
    vi.useFakeTimers()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    vi.useRealTimers()
  })

  it('should open a WebSocket to the given url', () => {
    connectDevCompileStatus({
      onChange: vi.fn(),
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:3000/_next/webpack-hmr')
  })

  it('should not call onChange(true) immediately on a building message', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should call onChange(true) once a building message has stayed pending for 100ms', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    vi.advanceTimersByTime(100)

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('should suppress a building message entirely if built arrives before the 100ms defer elapses', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    vi.advanceTimersByTime(50)
    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'built' }) })
    vi.advanceTimersByTime(100)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should suppress a building message entirely if sync arrives before the 100ms defer elapses', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    vi.advanceTimersByTime(50)
    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'sync' }) })
    vi.advanceTimersByTime(100)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should call onChange(false) when built arrives after building was already shown', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    vi.advanceTimersByTime(100)
    onChange.mockClear()

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'built' }) })

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('should call onChange(false) when sync arrives after building was already shown', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    vi.advanceTimersByTime(100)
    onChange.mockClear()

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'sync' }) })

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('should restart the 100ms defer if a second building message arrives before it elapses', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    vi.advanceTimersByTime(80)
    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    vi.advanceTimersByTime(80)

    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(20)

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('should ignore unrelated message types', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'addedPage' }) })
    vi.advanceTimersByTime(100)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should swallow malformed message data without throwing', () => {
    const onChange = vi.fn()
    connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    expect(() => MockWebSocket.instances[0].onmessage?.({ data: 'not-json' })).not.toThrow()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('should close the socket and cancel any pending deferred show when cleanup is called', () => {
    const onChange = vi.fn()
    const cleanup = connectDevCompileStatus({
      onChange,
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'building' }) })
    cleanup()
    vi.advanceTimersByTime(100)

    expect(onChange).not.toHaveBeenCalled()
    expect(MockWebSocket.instances[0].close).toHaveBeenCalledTimes(1)
  })

  it('should never construct a WebSocket in production', () => {
    process.env.NODE_ENV = 'production'

    const cleanup = connectDevCompileStatus({
      onChange: vi.fn(),
      url: 'ws://localhost:3000/_next/webpack-hmr',
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
    })

    expect(MockWebSocket.instances).toHaveLength(0)
    expect(() => cleanup()).not.toThrow()
  })
})
