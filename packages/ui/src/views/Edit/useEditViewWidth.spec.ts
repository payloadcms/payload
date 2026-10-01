// @vitest-environment happy-dom

import type { Root } from 'react-dom/client'

import { act, createElement, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EditViewAlignment, EditViewWidth } from '../../providers/Theme/shared.js'

import { useEditViewWidth } from './useEditViewWidth.js'

let container: HTMLDivElement
let root: Root
let mainWidth: number
let constrainedWidth: number
let resize: () => void
const disconnect = vi.fn()

const Form = ({
  editViewAlignment = 'left',
  editViewWidth = '960',
}: {
  editViewAlignment?: EditViewAlignment
  editViewWidth?: EditViewWidth
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEditViewWidth({ editViewAlignment, editViewWidth, ref })

  return createElement(
    'div',
    { className: 'collection-edit__main', ref },
    createElement(
      'div',
      { className: 'document-fields' },
      createElement(
        'div',
        { className: 'document-fields__main' },
        createElement(
          'div',
          { className: 'document-fields__edit' },
          createElement('div', { className: 'render-fields' }, createElement('input')),
        ),
      ),
    ),
  )
}

const getMain = () => container.querySelector('.collection-edit__main')
const isFullWidth = () => getMain().hasAttribute('data-edit-view-full-width')

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
    const isFilled = this.closest('.collection-edit__main')?.hasAttribute(
      'data-edit-view-full-width',
    )
    const width =
      (this.className === 'document-fields__edit' || this.className === 'document-fields') &&
      !isFilled
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
  ])('should fill a %ipx form column when unused space is at most 128px', (width, expected) => {
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
    act(() => root.render(createElement(Form, { editViewWidth: '1200' })))
    expect(isFullWidth()).toBe(false)
  })

  it('should fill a wide pane when Full is selected', () => {
    mainWidth = 2000
    act(() => root.render(createElement(Form, { editViewWidth: 'full' })))

    expect(isFullWidth()).toBe(true)
  })

  it('should restore the width cap when switching from Full to a fixed width', () => {
    mainWidth = 2000
    act(() => root.render(createElement(Form, { editViewWidth: 'full' })))
    act(() => root.render(createElement(Form, { editViewWidth: '1200' })))

    expect(isFullWidth()).toBe(false)
  })

  it('should measure the complete form when center all is selected', () => {
    mainWidth = 2000
    constrainedWidth = 1440

    act(() => root.render(createElement(Form, { editViewAlignment: 'center-all' })))

    expect(isFullWidth()).toBe(false)
  })

  it('should remeasure when form content changes without resizing the pane', async () => {
    act(() => root.render(createElement(Form)))
    expect(isFullWidth()).toBe(true)

    constrainedWidth = 864
    container.querySelector('.render-fields').replaceChildren()

    await vi.waitFor(() => {
      expect(isFullWidth()).toBe(false)
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
