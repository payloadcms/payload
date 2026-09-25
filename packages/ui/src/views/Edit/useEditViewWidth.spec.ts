// @vitest-environment happy-dom

import type { Root } from 'react-dom/client'

import { act, createElement, Fragment, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EditViewWidth } from '../../providers/Theme/shared.js'

import { useEditViewWidth } from './useEditViewWidth.js'

let container: HTMLDivElement
let root: Root
let mainWidth: number
let constrainedWidth: number
let resize: () => void
const disconnect = vi.fn()

const Form = ({
  editViewWidth = '800',
  shouldAlignHeader = false,
}: {
  editViewWidth?: EditViewWidth
  shouldAlignHeader?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEditViewWidth({ editViewWidth, ref, shouldAlignHeader })

  return createElement(
    Fragment,
    null,
    createElement('div', { className: 'doc-header' }),
    createElement(
      'main',
      { className: 'collection-edit' },
      createElement(
        'form',
        { className: 'collection-edit__form' },
        createElement('div', { className: 'doc-controls' }),
        createElement(
          'div',
          { className: 'collection-edit__main', ref },
          createElement(
            'div',
            { className: 'document-fields' },
            createElement('div', { className: 'render-fields' }, createElement('input')),
          ),
        ),
      ),
    ),
  )
}

const getMain = () => container.querySelector('.collection-edit__main')
const isFullWidth = () => getMain().hasAttribute('data-edit-view-full-width')
const getBars = () => container.querySelectorAll<HTMLElement>('.doc-header, .doc-controls')

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  mainWidth = 1456
  constrainedWidth = 1328
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      disconnect = disconnect
      observe = vi.fn()
    },
  )
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const isFilled = this.parentElement?.hasAttribute('data-edit-view-full-width')
    const width =
      this.className === 'document-fields' && !isFilled
        ? Math.min(mainWidth, constrainedWidth)
        : mainWidth

    return { width } as DOMRect
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  disconnect.mockClear()
  delete globalThis.IS_REACT_ACT_ENVIRONMENT
})

describe('edit view whitespace', () => {
  it.each([
    [1400, true],
    [1456, true],
    [1457, false],
  ])('should fill a %ipx pane only when each outside margin is at most 64px', (width, expected) => {
    mainWidth = width
    act(() => root.render(createElement(Form)))

    expect(isFullWidth()).toBe(expected)
  })

  it('should restore the cap after the available pane grows and fill again when it shrinks', () => {
    act(() => root.render(createElement(Form)))
    expect(isFullWidth()).toBe(true)

    mainWidth = 1600
    resize()
    expect(isFullWidth()).toBe(false)

    mainWidth = 1400
    resize()
    expect(isFullWidth()).toBe(true)
  })

  it('should remeasure when the selected width changes without resizing the pane', () => {
    act(() => root.render(createElement(Form)))
    expect(isFullWidth()).toBe(true)

    constrainedWidth = 1168
    act(() => root.render(createElement(Form, { editViewWidth: '640' })))
    expect(isFullWidth()).toBe(false)
  })

  it('should fill a wide pane and align both bars when Full is selected', () => {
    mainWidth = 2000
    act(() => root.render(createElement(Form, { editViewWidth: 'full', shouldAlignHeader: true })))

    expect(isFullWidth()).toBe(true)
    for (const bar of getBars()) {
      expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('2000px')
    }
  })

  it('should restore the width cap when switching from Full to a fixed width', () => {
    mainWidth = 2000
    act(() => root.render(createElement(Form, { editViewWidth: 'full', shouldAlignHeader: true })))
    act(() => root.render(createElement(Form, { editViewWidth: '800', shouldAlignHeader: true })))

    expect(isFullWidth()).toBe(false)
    for (const bar of getBars()) {
      expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('1328px')
    }
  })

  it('should leave the header and controls unchanged when alignment is off', () => {
    act(() => root.render(createElement(Form)))

    for (const bar of getBars()) {
      expect(bar.hasAttribute('data-edit-view-aligned')).toBe(false)
      expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('')
    }
  })

  it('should align both bars and follow the form when the pane shrinks', () => {
    mainWidth = 1600
    act(() => root.render(createElement(Form, { shouldAlignHeader: true })))

    for (const bar of getBars()) {
      expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('1328px')
    }

    mainWidth = 1400
    resize()

    for (const bar of getBars()) {
      expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('1400px')
    }
  })

  it('should restore both bars immediately when alignment is turned off', () => {
    act(() => root.render(createElement(Form, { shouldAlignHeader: true })))
    expect(getBars()[0].hasAttribute('data-edit-view-aligned')).toBe(true)

    act(() => root.render(createElement(Form, { shouldAlignHeader: false })))

    for (const bar of getBars()) {
      expect(bar.hasAttribute('data-edit-view-aligned')).toBe(false)
      expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('')
    }
    expect(isFullWidth()).toBe(true)
  })

  it('should align to the narrower form when there are no sidebar fields', () => {
    constrainedWidth = 864
    act(() => root.render(createElement(Form, { shouldAlignHeader: true })))

    for (const bar of getBars()) {
      expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('864px')
    }
  })

  it('should remeasure when sidebar content disappears without resizing the pane', async () => {
    act(() => root.render(createElement(Form, { shouldAlignHeader: true })))
    expect(isFullWidth()).toBe(true)

    constrainedWidth = 864
    container.querySelector('.render-fields').replaceChildren()

    await vi.waitFor(() => {
      expect(isFullWidth()).toBe(false)
      for (const bar of getBars()) {
        expect(bar.style.getPropertyValue('--edit-view-content-width')).toBe('864px')
      }
    })
  })

  it('should disconnect the observer and remove the override on unmount', () => {
    act(() => root.render(createElement(Form)))
    const main = getMain()

    act(() => root.render(null))

    expect(disconnect).toHaveBeenCalledOnce()
    expect(main.hasAttribute('data-edit-view-full-width')).toBe(false)
  })
})
