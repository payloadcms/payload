import { describe, expect, it, vi } from 'vitest'

import { connectDevCompileStatus } from './listener.js'

describe('connectDevCompileStatus (TanStack/Vite)', () => {
  it('should subscribe to the payload:compiling event on connect', () => {
    const hot = { off: vi.fn(), on: vi.fn() }

    connectDevCompileStatus({ hot, onChange: vi.fn() })

    expect(hot.on).toHaveBeenCalledExactlyOnceWith('payload:compiling', expect.any(Function))
  })

  it('should call onChange with the received isCompiling value', () => {
    const hot = { off: vi.fn(), on: vi.fn() }
    const onChange = vi.fn()

    connectDevCompileStatus({ hot, onChange })

    const handler = hot.on.mock.calls[0][1]
    handler({ isCompiling: true })

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('should unsubscribe when the returned cleanup function is called', () => {
    const hot = { off: vi.fn(), on: vi.fn() }

    const cleanup = connectDevCompileStatus({ hot, onChange: vi.fn() })
    const handler = hot.on.mock.calls[0][1]

    cleanup()

    expect(hot.off).toHaveBeenCalledExactlyOnceWith('payload:compiling', handler)
  })

  it('should no-op when import.meta.hot is undefined (production)', () => {
    const onChange = vi.fn()

    const cleanup = connectDevCompileStatus({ hot: undefined, onChange })

    expect(() => cleanup()).not.toThrow()
    expect(onChange).not.toHaveBeenCalled()
  })
})
