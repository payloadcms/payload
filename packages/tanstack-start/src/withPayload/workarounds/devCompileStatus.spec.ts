import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { payloadDevCompileStatus } from './devCompileStatus.js'

describe('payloadDevCompileStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should only apply during dev serve, never during build', () => {
    const plugin = payloadDevCompileStatus()

    expect(plugin.apply).toBe('serve')
  })

  it('should broadcast isCompiling: true immediately on a hot update', () => {
    const plugin = payloadDevCompileStatus()
    const send = vi.fn()

    // @ts-expect-error - minimal fake HmrContext, only `server.ws.send` is used
    plugin.handleHotUpdate({ server: { ws: { send } } })

    expect(send).toHaveBeenCalledExactlyOnceWith({
      data: { isCompiling: true },
      event: 'payload:compiling',
      type: 'custom',
    })
  })

  it('should broadcast isCompiling: false once hot-update activity settles', () => {
    const plugin = payloadDevCompileStatus()
    const send = vi.fn()

    // @ts-expect-error - minimal fake HmrContext, only `server.ws.send` is used
    plugin.handleHotUpdate({ server: { ws: { send } } })
    send.mockClear()

    vi.advanceTimersByTime(100)

    expect(send).toHaveBeenCalledExactlyOnceWith({
      data: { isCompiling: false },
      event: 'payload:compiling',
      type: 'custom',
    })
  })

  it('should debounce a burst of hot updates into a single hide', () => {
    const plugin = payloadDevCompileStatus()
    const send = vi.fn()
    const fakeContext = { server: { ws: { send } } }

    // @ts-expect-error - minimal fake HmrContext, only `server.ws.send` is used
    plugin.handleHotUpdate(fakeContext)
    vi.advanceTimersByTime(50)
    // @ts-expect-error - minimal fake HmrContext, only `server.ws.send` is used
    plugin.handleHotUpdate(fakeContext)
    vi.advanceTimersByTime(50)

    expect(send).not.toHaveBeenCalledWith(expect.objectContaining({ data: { isCompiling: false } }))

    vi.advanceTimersByTime(50)

    expect(send).toHaveBeenLastCalledWith({
      data: { isCompiling: false },
      event: 'payload:compiling',
      type: 'custom',
    })
  })
})
