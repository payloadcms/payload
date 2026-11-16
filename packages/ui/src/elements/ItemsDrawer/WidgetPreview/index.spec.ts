// @vitest-environment jsdom
import type { ClientWidget } from 'payload'
import type { Root } from 'react-dom/client'

import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { WidgetPreviewProvider } from '../WidgetPreviewProvider/index.js'
import { WidgetPreview } from './index.js'

const { serverFunction } = vi.hoisted(() => ({ serverFunction: vi.fn() }))

vi.mock('../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}))

type Visibility = { callback: IntersectionObserverCallback; element?: Element }
let observed: Visibility[]
let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  observed = []
  serverFunction.mockReset().mockResolvedValue({
    component: React.createElement('div', { 'data-rendered-preview': true }, 'Live content'),
  })
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      record: Visibility
      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback }
        observed.push(this.record)
      }
      observe(element: Element) {
        this.record.element = element
      }
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      callback: () => void
      constructor(callback: () => void) {
        this.callback = callback
      }
      observe() {
        this.callback()
      }
      disconnect() {}
    },
  )
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(180)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(180)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(600)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function render({ widgets }: { widgets: ClientWidget[] }) {
  await act(async () =>
    root.render(
      React.createElement(WidgetPreviewProvider, {
        children: widgets.map((widget, index) =>
          React.createElement(WidgetPreview, { key: `${widget.slug}-${index}`, widget }),
        ),
      }),
    ),
  )
}

async function reveal() {
  await act(async () => {
    for (const { callback, element } of [...observed]) {
      callback(
        [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    }
  })
}

it('should wait until a thumbnail is visible and scale the rendered widget into its frame', async () => {
  await render({ widgets: [{ slug: 'sales' }] })
  expect(serverFunction).not.toHaveBeenCalled()
  await reveal()
  expect(serverFunction).toHaveBeenCalledExactlyOnceWith({
    name: 'render-widget',
    args: expect.objectContaining({ isPreview: true, widgetSlug: 'sales' }),
  })
  expect(container.querySelector('[data-rendered-preview]')?.textContent).toBe('Live content')
  expect(container.querySelector<HTMLElement>('.widget-preview__canvas')?.style.transform).toBe(
    'scale(0.3)',
  )
  expect(container.querySelector('.widget-preview')?.hasAttribute('inert')).toBe(true)
})

it('should share one request per widget within the drawer, including after filtering', async () => {
  await render({ widgets: [{ slug: 'sales' }, { slug: 'sales' }] })
  await reveal()
  expect(serverFunction).toHaveBeenCalledTimes(1)
  await render({ widgets: [] })
  await render({ widgets: [{ slug: 'sales' }] })
  await reveal()
  expect(serverFunction).toHaveBeenCalledTimes(1)
  expect(container.querySelector('[data-rendered-preview]')).not.toBeNull()
})

it('should leave opted-out widgets as neutral thumbnails without fetching', async () => {
  await render({ widgets: [{ slug: 'sales', preview: false }] })
  await reveal()
  expect(serverFunction).not.toHaveBeenCalled()
  expect(observed).toHaveLength(0)
})

it('should cache failures and keep the thumbnail usable', async () => {
  serverFunction.mockRejectedValueOnce(new Error('Unavailable'))
  await render({ widgets: [{ slug: 'sales' }] })
  await reveal()
  expect(container.querySelector('.widget-preview')?.getAttribute('data-state')).toBe('ready')
  expect(container.querySelector('.widget-preview__canvas')).toBeNull()
  await render({ widgets: [] })
  await render({ widgets: [{ slug: 'sales' }] })
  await reveal()
  expect(serverFunction).toHaveBeenCalledTimes(1)
})

it('should contain errors in custom previews so the picker can stay open', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  function BrokenPreview(): React.ReactNode {
    throw new Error('Broken widget')
  }
  serverFunction.mockResolvedValueOnce({ component: React.createElement(BrokenPreview) })
  await render({ widgets: [{ slug: 'sales' }, { slug: 'other' }] })
  await reveal()
  expect(container.querySelectorAll('.widget-preview')).toHaveLength(2)
  expect(container.querySelector('[data-rendered-preview]')).not.toBeNull()
})
