// @vitest-environment happy-dom

import type { Root } from 'react-dom/client'

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider, useTheme } from './index.js'

vi.mock('../Config/index.js', () => ({
  useConfig: () => ({ config: { admin: { theme: 'light' }, cookiePrefix: 'type-size-test' } }),
}))
vi.mock('../RouterAdapter/index.js', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

let container: HTMLDivElement
let root: Root

const SizeControl = () => {
  const { setTypeSize, typeSize } = useTheme()

  return createElement('button', { onClick: () => setTypeSize({ typeSize: 'large' }) }, typeSize)
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.cookie = 'type-size-test-edit-view-header-alignment=; max-age=0; path=/'
  document.cookie = 'type-size-test-edit-view-width=; max-age=0; path=/'
  document.documentElement.removeAttribute('data-edit-view-width')
  document.cookie = 'type-size-test-type-size=; max-age=0; path=/'
  document.documentElement.removeAttribute('data-type-size')
  document.documentElement.removeAttribute('data-enhanced-contrast')
  delete globalThis.IS_REACT_ACT_ENVIRONMENT
})

describe('type size preferences', () => {
  it('should update the root preference from a scoped popup theme', () => {
    act(() => {
      root.render(
        createElement(
          ThemeProvider,
          null,
          createElement(SizeControl),
          createElement(ThemeProvider, { theme: 'dark' }, createElement(SizeControl)),
        ),
      )
    })

    const buttons = container.querySelectorAll('button')

    expect(buttons[0].textContent).toBe('default')
    expect(buttons[1].textContent).toBe('default')

    act(() => buttons[1].click())

    expect(buttons[0].textContent).toBe('large')
    expect(buttons[1].textContent).toBe('large')
    expect(document.documentElement.getAttribute('data-type-size')).toBe('large')
    expect(document.cookie).toContain('type-size-test-type-size=large')
  })

  it.each(['small', 'default', 'large'])('should restore the saved %s size', (typeSize) => {
    document.cookie = `type-size-test-type-size=${typeSize}; path=/`

    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(SizeControl)))
    })

    expect(container.textContent).toBe(typeSize)
    expect(document.documentElement.getAttribute('data-type-size')).toBe(typeSize)
  })

  it('should fall back to Default for an invalid saved size', () => {
    document.cookie = 'type-size-test-type-size=invalid; path=/'

    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(SizeControl)))
    })

    expect(container.textContent).toBe('default')
    expect(document.documentElement.getAttribute('data-type-size')).toBe('default')
  })
})

const WidthControl = () => {
  const { editViewWidth, setEditViewWidth } = useTheme()

  return createElement(
    'button',
    { onClick: () => setEditViewWidth({ editViewWidth: '640' }) },
    editViewWidth,
  )
}

describe('edit view width preferences', () => {
  it('should update the root width from a scoped popup without changing the type size', () => {
    document.cookie = 'type-size-test-type-size=large; path=/'

    act(() => {
      root.render(
        createElement(
          ThemeProvider,
          null,
          createElement(WidthControl),
          createElement(ThemeProvider, { theme: 'dark' }, createElement(WidthControl)),
          createElement(SizeControl),
        ),
      )
    })

    const buttons = container.querySelectorAll('button')

    expect(buttons[0].textContent).toBe('full')
    expect(buttons[1].textContent).toBe('full')

    act(() => buttons[1].click())

    expect(buttons[0].textContent).toBe('640')
    expect(buttons[1].textContent).toBe('640')
    expect(buttons[2].textContent).toBe('large')
    expect(document.documentElement.getAttribute('data-edit-view-width')).toBe('640')
    expect(document.cookie).toContain('type-size-test-edit-view-width=640')
  })

  it.each(['640', '800', '960', 'full'])('should restore the saved %s width', (editViewWidth) => {
    document.cookie = `type-size-test-edit-view-width=${editViewWidth}; path=/`

    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(WidthControl)))
    })

    expect(container.textContent).toBe(editViewWidth)
    expect(document.documentElement.getAttribute('data-edit-view-width')).toBe(editViewWidth)
  })

  it('should fall back to full width for an invalid saved width', () => {
    document.cookie = 'type-size-test-edit-view-width=invalid; path=/'

    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(WidthControl)))
    })

    expect(container.textContent).toBe('full')
    expect(document.documentElement.getAttribute('data-edit-view-width')).toBe('full')
  })
})

const HeaderAlignmentControl = () => {
  const { setEditViewHeaderAlignment, shouldAlignEditViewHeader } = useTheme()

  return createElement(
    'button',
    {
      'aria-pressed': shouldAlignEditViewHeader,
      onClick: () => setEditViewHeaderAlignment({ isEnabled: !shouldAlignEditViewHeader }),
    },
    'Align header and controls',
  )
}

describe('edit view header alignment preference', () => {
  it('should default to off and persist toggles from a scoped settings popup', () => {
    act(() => {
      root.render(
        createElement(
          ThemeProvider,
          null,
          createElement(HeaderAlignmentControl),
          createElement(ThemeProvider, { theme: 'dark' }, createElement(HeaderAlignmentControl)),
        ),
      )
    })

    const buttons = container.querySelectorAll('button')

    expect(buttons[0].getAttribute('aria-pressed')).toBe('false')
    act(() => buttons[1].click())
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true')
    expect(document.cookie).toContain('type-size-test-edit-view-header-alignment=true')

    act(() => buttons[1].click())
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false')
    expect(document.cookie).toContain('type-size-test-edit-view-header-alignment=false')
  })

  it.each(['true', 'false', 'invalid'])('should restore the saved %s preference', (value) => {
    document.cookie = `type-size-test-edit-view-header-alignment=${value}; path=/`

    act(() =>
      root.render(createElement(ThemeProvider, null, createElement(HeaderAlignmentControl))),
    )

    expect(container.querySelector('button').getAttribute('aria-pressed')).toBe(
      String(value === 'true'),
    )
  })
})
