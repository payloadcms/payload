import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { useDelay } from './useDelay.js'

describe('useDelay', () => {
  test('should clear the mount timeout on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const screen = await render(<DelayFixture />)
    const callsBeforeUnmount = clearTimeoutSpy.mock.calls.length

    await screen.unmount()

    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callsBeforeUnmount)
    clearTimeoutSpy.mockRestore()
  })
})

function DelayFixture() {
  const [hasDelayed] = useDelay(60_000, true)

  return <output>{String(hasDelayed)}</output>
}
