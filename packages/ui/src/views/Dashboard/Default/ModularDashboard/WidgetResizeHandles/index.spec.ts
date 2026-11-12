// @vitest-environment jsdom
import type { WidgetWidth } from 'payload'

import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { WidgetResizeHandles } from './index.js'

vi.mock('../../../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: () => 'Resize widget' }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function withHandles({
  run,
}: {
  run: (args: { end: HTMLDivElement; start: HTMLDivElement }) => void
}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')

  container.className = 'modular-dashboard'
  document.body.append(container)
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ width: 1200 } as DOMRect)
  const root = createRoot(container)
  const Harness = () => {
    const [width, setWidth] = useState<WidgetWidth>('medium')

    return React.createElement(WidgetResizeHandles, {
      maxWidth: 'large',
      minWidth: 'small',
      onResize: ({ width }) => setWidth(width),
      widgetLabel: 'Test',
      width,
    })
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    const start = container.querySelector<HTMLDivElement>('.widget-resize-handle--start')!
    const end = container.querySelector<HTMLDivElement>('.widget-resize-handle--end')!

    for (const handle of [start, end]) {
      Object.assign(handle, {
        hasPointerCapture: () => true,
        releasePointerCapture: vi.fn(),
        setPointerCapture: vi.fn(),
      })
    }
    run({ end, start })
  } finally {
    act(() => root.unmount())
    container.remove()
  }
}

function pointer({ element, type, x }: { element: HTMLElement; type: string; x: number }) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x })

  Object.defineProperty(event, 'pointerId', { value: 1 })
  act(() => {
    element.dispatchEvent(event)
  })
}

it('should resize with arrow keys and respect min/max widths with Home and End', () => {
  withHandles({
    run: ({ end }) => {
      const press = ({ key }: { key: string }) =>
        act(() => {
          end.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
        })

      press({ key: 'ArrowRight' })
      expect(end.getAttribute('aria-valuetext')).toBe('large')
      press({ key: 'ArrowRight' })
      expect(end.getAttribute('aria-valuetext')).toBe('large')
      press({ key: 'Home' })
      expect(end.getAttribute('aria-valuetext')).toBe('small')
      press({ key: 'End' })
      expect(end.getAttribute('aria-valuetext')).toBe('large')
    },
  })
})

it.each([
  { edge: 'end', direction: 'ltr', x: 800 },
  { edge: 'start', direction: 'ltr', x: 400 },
  { edge: 'end', direction: 'rtl', x: 400 },
  { edge: 'start', direction: 'rtl', x: 800 },
] as const)(
  'should resize the $edge edge in $direction and retain the width after release',
  ({ direction, edge, x }) => {
    withHandles({
      run: (handles) => {
        const handle = handles[edge]

        handle.style.direction = direction
        pointer({ element: handle, type: 'pointerdown', x: 600 })
        pointer({ element: handle, type: 'pointermove', x })
        expect(handle.getAttribute('aria-valuetext')).toBe('large')
        pointer({ element: handle, type: 'pointerup', x })
        pointer({ element: handle, type: 'lostpointercapture', x })
        expect(handle.getAttribute('aria-valuetext')).toBe('large')
        expect(document.body.classList.contains('is-resizing-widgets')).toBe(false)
      },
    })
  },
)

it('should restore the original width when a pointer resize is canceled', () => {
  withHandles({
    run: ({ end }) => {
      pointer({ element: end, type: 'pointerdown', x: 600 })
      pointer({ element: end, type: 'pointermove', x: 800 })
      expect(end.getAttribute('aria-valuetext')).toBe('large')
      pointer({ element: end, type: 'pointercancel', x: 800 })
      expect(end.getAttribute('aria-valuetext')).toBe('medium')
      expect(document.body.classList.contains('is-resizing-widgets')).toBe(false)
    },
  })
})

it('should restore the original width when Escape cancels a pointer resize', () => {
  withHandles({
    run: ({ end }) => {
      pointer({ element: end, type: 'pointerdown', x: 600 })
      pointer({ element: end, type: 'pointermove', x: 800 })
      expect(end.getAttribute('aria-valuetext')).toBe('large')
      act(() => {
        end.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))
      })
      expect(end.getAttribute('aria-valuetext')).toBe('medium')
      expect(document.body.classList.contains('is-resizing-widgets')).toBe(false)
    },
  })
})

it('should retain the preview if pointer capture is lost before pointerup', () => {
  withHandles({
    run: ({ end }) => {
      pointer({ element: end, type: 'pointerdown', x: 600 })
      pointer({ element: end, type: 'pointermove', x: 800 })
      pointer({ element: end, type: 'lostpointercapture', x: 800 })
      pointer({ element: end, type: 'pointerup', x: 800 })
      expect(end.getAttribute('aria-valuetext')).toBe('large')
      expect(document.body.classList.contains('is-resizing-widgets')).toBe(false)
    },
  })
})

it('should retain the preview if the handle loses focus before pointerup', () => {
  withHandles({
    run: ({ end }) => {
      pointer({ element: end, type: 'pointerdown', x: 600 })
      pointer({ element: end, type: 'pointermove', x: 800 })
      act(() => end.blur())
      pointer({ element: end, type: 'pointerup', x: 800 })
      expect(end.getAttribute('aria-valuetext')).toBe('large')
      expect(document.body.classList.contains('is-resizing-widgets')).toBe(false)
    },
  })
})

it('should retain the final width when pointer updates are batched before a render', () => {
  withHandles({
    run: ({ end }) => {
      pointer({ element: end, type: 'pointerdown', x: 600 })
      act(() => {
        pointer({ element: end, type: 'pointermove', x: 800 })
        pointer({ element: end, type: 'pointermove', x: 600 })
        pointer({ element: end, type: 'pointerup', x: 600 })
      })
      expect(end.getAttribute('aria-valuetext')).toBe('medium')
    },
  })
})
