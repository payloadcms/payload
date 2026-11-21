// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import { RenderWidget } from './RenderWidget.js'

const { serverFunction } = vi.hoisted(() => ({ serverFunction: vi.fn() }))

vi.mock('../../../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))

it('should retain the current widget while loading and ignore superseded responses', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const requests: ((value: { component: React.ReactNode }) => void)[] = []

  serverFunction.mockImplementation(() => new Promise((resolve) => requests.push(resolve)))

  try {
    await act(async () => {
      root.render(
        React.createElement(RenderWidget, {
          initialComponent: React.createElement('p', null, 'Original'),
          widgetData: { value: 1 },
          widgetId: 'example-1',
        }),
      )
    })
    expect(container.textContent).toBe('Original')
    await act(async () => {
      root.render(
        React.createElement(RenderWidget, { widgetData: { value: 2 }, widgetId: 'example-1' }),
      )
    })
    expect(container.textContent).toBe('Original')
    await act(async () => requests[1]({ component: React.createElement('p', null, 'Latest') }))
    expect(container.textContent).toBe('Latest')
    await act(async () => requests[0]({ component: React.createElement('p', null, 'Outdated') }))
    expect(container.textContent).toBe('Latest')
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
    serverFunction.mockReset()
  }
})
