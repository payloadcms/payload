import { describe, expect, it } from 'vitest'

import { setHandlePosition } from '../plugins/handles/utils/setHandlePosition.js'
import { setFloatingElemPosition } from './setFloatingElemPosition.js'
import { setFloatingElemPositionForLinkEditor } from './setFloatingElemPositionForLinkEditor.js'

const rect = (o: Partial<DOMRect> = {}) =>
  ({ bottom: 100, height: 20, left: 50, right: 150, top: 80, width: 100, ...o }) as DOMRect

const el = (r: DOMRect = rect()) =>
  ({
    getBoundingClientRect: () => r,
    parentElement: { getBoundingClientRect: () => rect({ left: 0, right: 1000, top: 0 }) },
    scrollWidth: 100,
    style: {} as Record<string, string>,
  }) as unknown as HTMLElement

describe('hidden floating elements do not translate off-screen', () => {
  it('setFloatingElemPosition', () => {
    const floatingElem = el()
    const anchorElem = el()
    setFloatingElemPosition({ anchorElem, floatingElem, targetRect: null })
    expect(floatingElem.style.opacity).toBe('0')
    expect(floatingElem.style.pointerEvents).toBe('none')
    expect(floatingElem.style.transform).toBe('none')

    setFloatingElemPosition({ anchorElem, floatingElem, targetRect: rect({ top: 200 }) })
    expect(floatingElem.style.opacity).toBe('1')
    expect(floatingElem.style.pointerEvents).toBe('')
    expect(floatingElem.style.transform).toMatch(/^translate\(-?\d+(\.\d+)?px, -?\d+(\.\d+)?px\)$/)
    expect(floatingElem.style.transform).not.toContain('10000')
  })

  it('setFloatingElemPositionForLinkEditor', () => {
    const floatingElem = el()
    const anchorElem = el()
    setFloatingElemPositionForLinkEditor(null, floatingElem, anchorElem)
    expect(floatingElem.style.opacity).toBe('0')
    expect(floatingElem.style.pointerEvents).toBe('none')
    expect(floatingElem.style.transform).toBe('none')

    setFloatingElemPositionForLinkEditor(rect({ top: 200 }), floatingElem, anchorElem)
    expect(floatingElem.style.opacity).toBe('1')
    expect(floatingElem.style.pointerEvents).toBe('')
    expect(floatingElem.style.transform).toBe('translate(-5px, 110px)')
  })

  it('setHandlePosition hides without a 10000px translate', () => {
    const handleElem = el()
    setHandlePosition(null, handleElem, el())
    expect(handleElem.style.opacity).toBe('0')
    expect(handleElem.style.visibility).toBe('hidden')
    expect(handleElem.style.transform).toBe('none')
  })
})
