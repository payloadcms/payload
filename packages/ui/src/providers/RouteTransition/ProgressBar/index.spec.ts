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

test('should not show progress for transitions that finish before the initial delay', async () => {
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

test('should wait 200ms before showing progress', async () => {
  await startTransition()
  await advanceTime({ milliseconds: 199 })

  expect(container.querySelector('.progress-bar')).toBeNull()

  await advanceTime({ milliseconds: 1 })

  expect(container.querySelector('.progress-bar')).not.toBeNull()
})

test('should remove progress in place when a load finishes before 1000ms', async () => {
  const release = await startTransition()

  await advanceTime({ milliseconds: 999 })

  expect(container.querySelector('.progress-bar')).not.toBeNull()

  await act(async () => release())

  expect(container.querySelector('.progress-bar')).toBeNull()
})

test('should progress to full width when a load takes at least 1000ms', async () => {
  const release = await startTransition()

  await advanceTime({ milliseconds: 1000 })
  await act(async () => release())

  expect(container.querySelector<HTMLElement>('.progress-bar__progress')?.style.width).toBe('100%')
  expect(container.querySelector('.progress-bar--fade-out')).not.toBeNull()

  await advanceTime({ milliseconds: 399 })

  expect(container.querySelector('.progress-bar')).not.toBeNull()

  await advanceTime({ milliseconds: 1 })

  expect(container.querySelector('.progress-bar')).toBeNull()
})

test('should measure each load separately when a new load starts during completion', async () => {
  const releaseFirst = await startTransition()

  await advanceTime({ milliseconds: 1000 })
  await act(async () => releaseFirst())

  let releaseSecond: () => void

  await act(async () => {
    releaseSecond = holdTransition()
  })
  await advanceTime({ milliseconds: 500 })

  expect(container.querySelector('.progress-bar')).not.toBeNull()
  expect(container.querySelector('.progress-bar--fade-out')).toBeNull()

  await act(async () => releaseSecond())

  expect(container.querySelector('.progress-bar')).toBeNull()
})

let holdTransition: () => () => void

async function startTransition() {
  vi.useFakeTimers()

  const TransitionControl = () => {
    const { holdRouteTransition } = useRouteTransition()

    holdTransition = holdRouteTransition

    return null
  }

  await act(async () => {
    root.render(
      createElement(
        RouteTransitionProvider,
        null,
        createElement(ProgressBar),
        createElement(TransitionControl),
      ),
    )
  })

  let release: () => void

  await act(async () => {
    release = holdTransition()
  })

  return release!
}

async function advanceTime({ milliseconds }: { milliseconds: number }) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}
