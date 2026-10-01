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

  return createElement('button', { onClick: () => setTypeSize({ typeSize: 'current' }) }, typeSize)
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
  document.cookie = 'type-size-test-edit-view-alignment=; max-age=0; path=/'
  document.cookie = 'type-size-test-edit-view-width=; max-age=0; path=/'
  document.documentElement.removeAttribute('data-edit-view-alignment')
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

    expect(buttons[0].textContent).toBe('proposed')
    expect(buttons[1].textContent).toBe('proposed')

    act(() => buttons[1].click())

    expect(buttons[0].textContent).toBe('current')
    expect(buttons[1].textContent).toBe('current')
    expect(document.documentElement.getAttribute('data-type-size')).toBe('current')
    expect(document.cookie).toContain('type-size-test-type-size=current')
  })

  it.each(['current', 'proposed'])('should restore the saved %s size', (typeSize) => {
    document.cookie = `type-size-test-type-size=${typeSize}; path=/`

    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(SizeControl)))
    })

    expect(container.textContent).toBe(typeSize)
    expect(document.documentElement.getAttribute('data-type-size')).toBe(typeSize)
  })

  it.each([
    ['small', 'current'],
    ['default', 'proposed'],
    ['large', 'proposed'],
  ])('should migrate the saved %s size to %s', (saved, expected) => {
    document.cookie = `type-size-test-type-size=${saved}; path=/`

    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(SizeControl)))
    })

    expect(container.textContent).toBe(expected)
    expect(document.documentElement.getAttribute('data-type-size')).toBe(expected)
  })

  it('should fall back to Proposed for an invalid saved size', () => {
    document.cookie = 'type-size-test-type-size=invalid; path=/'

    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(SizeControl)))
    })

    expect(container.textContent).toBe('proposed')
    expect(document.documentElement.getAttribute('data-type-size')).toBe('proposed')
  })
})

const WidthControl = () => {
  const { editViewWidth, setEditViewWidth } = useTheme()

  return createElement(
    'button',
    { onClick: () => setEditViewWidth({ editViewWidth: '960' }) },
    editViewWidth,
  )
}

describe('edit view width preferences', () => {
  it('should update the root width from a scoped popup without changing the type size', () => {
    document.cookie = 'type-size-test-type-size=current; path=/'

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

    expect(buttons[0].textContent).toBe('960')
    expect(buttons[1].textContent).toBe('960')
    expect(buttons[2].textContent).toBe('current')
    expect(document.documentElement.getAttribute('data-edit-view-width')).toBe('960')
    expect(document.cookie).toContain('type-size-test-edit-view-width=960')
  })

  it.each(['960', '1200', '1440', 'full'])('should restore the saved %s width', (editViewWidth) => {
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

const AlignmentControl = () => {
  const { editViewAlignment, setEditViewAlignment } = useTheme()

  return createElement(
    'button',
    { onClick: () => setEditViewAlignment({ editViewAlignment: 'center-all' }) },
    editViewAlignment,
  )
}

describe('edit view alignment preferences', () => {
  it('should update the root alignment from a scoped popup', () => {
    act(() => {
      root.render(
        createElement(
          ThemeProvider,
          null,
          createElement(AlignmentControl),
          createElement(ThemeProvider, { theme: 'dark' }, createElement(AlignmentControl)),
        ),
      )
    })

    const buttons = container.querySelectorAll('button')

    expect(buttons[0].textContent).toBe('left')
    expect(buttons[1].textContent).toBe('left')

    act(() => buttons[1].click())

    expect(buttons[0].textContent).toBe('center-all')
    expect(buttons[1].textContent).toBe('center-all')
    expect(document.documentElement.getAttribute('data-edit-view-alignment')).toBe('center-all')
    expect(document.cookie).toContain('type-size-test-edit-view-alignment=center-all')
  })

  it.each(['left', 'center', 'center-all'])('should restore the saved %s alignment', (value) => {
    document.cookie = `type-size-test-edit-view-alignment=${value}; path=/`

    act(() => root.render(createElement(ThemeProvider, null, createElement(AlignmentControl))))

    expect(container.textContent).toBe(value)
    expect(document.documentElement.getAttribute('data-edit-view-alignment')).toBe(value)
  })

  it('should fall back to left alignment for an invalid saved value', () => {
    document.cookie = 'type-size-test-edit-view-alignment=invalid; path=/'

    act(() => root.render(createElement(ThemeProvider, null, createElement(AlignmentControl))))

    expect(container.textContent).toBe('left')
    expect(document.documentElement.getAttribute('data-edit-view-alignment')).toBe('left')
  })
})
