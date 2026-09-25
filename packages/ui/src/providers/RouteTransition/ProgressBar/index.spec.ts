// @vitest-environment happy-dom

import { act, createElement, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { RouteTransitionProvider, useRouteTransition } from '../index.js'
import { ProgressBar } from './index.js'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

test('does not show progress for transitions that finish before the initial delay', async () => {
  vi.useFakeTimers()

  const FastTransition = () => {
    const { holdRouteTransition } = useRouteTransition()

    useEffect(() => {
      const releaseRouteTransition = holdRouteTransition()
      const timeout = setTimeout(releaseRouteTransition, 50)

      return () => {
        clearTimeout(timeout)
        releaseRouteTransition()
      }
    }, [holdRouteTransition])

    return null
  }

  await act(async () => {
    root.render(
      createElement(
        RouteTransitionProvider,
        null,
        createElement(ProgressBar),
        createElement(FastTransition),
      ),
    )
  })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(50)
  })

  expect(container.querySelector('.progress-bar')).toBeNull()
})
