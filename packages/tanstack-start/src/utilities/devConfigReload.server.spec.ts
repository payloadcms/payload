import { describe, expect, it, vi } from 'vitest'

vi.mock('payload', () => ({
  registerDevReloadStrategy: vi.fn(),
}))

import { createConfigChangedStrategy } from './devConfigReload.server.js'
import { PAYLOAD_CONFIG_CHANGED_EVENT } from './devConfigReloadEvent.js'

const createHot = () => {
  const handlers = new Map<string, () => void>()

  return {
    emit: (event: string) => handlers.get(event)?.(),
    on: (event: string, cb: () => void) => {
      handlers.set(event, cb)
    },
  }
}

describe('createConfigChangedStrategy', () => {
  it('should notify connected instances when the config changes', () => {
    const hot = createHot()
    const strategy = createConfigChangedStrategy({ hot })
    const onReload = vi.fn()

    strategy.connect(onReload)
    hot.emit(PAYLOAD_CONFIG_CHANGED_EVENT)

    expect(onReload).toHaveBeenCalledOnce()
  })

  it('should replay a config change that arrived before any instance connected', () => {
    const hot = createHot()
    const strategy = createConfigChangedStrategy({ hot })
    const onReload = vi.fn()

    hot.emit(PAYLOAD_CONFIG_CHANGED_EVENT)
    strategy.connect(onReload)

    expect(onReload).toHaveBeenCalledOnce()
  })

  it('should replay a missed config change only once', () => {
    const hot = createHot()
    const strategy = createConfigChangedStrategy({ hot })
    const first = vi.fn()
    const second = vi.fn()

    hot.emit(PAYLOAD_CONFIG_CHANGED_EVENT)
    strategy.connect(first)
    strategy.connect(second)

    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })

  it('should stop notifying an instance after it disconnects', () => {
    const hot = createHot()
    const strategy = createConfigChangedStrategy({ hot })
    const onReload = vi.fn()

    const disconnect = strategy.connect(onReload)
    disconnect()
    hot.emit(PAYLOAD_CONFIG_CHANGED_EVENT)

    expect(onReload).not.toHaveBeenCalled()
  })
})
