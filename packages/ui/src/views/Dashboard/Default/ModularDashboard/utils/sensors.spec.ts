// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { droppableJumpKeyboardCoordinateGetter } from './sensors.js'

let fixture: HTMLDivElement

beforeEach(() => {
  fixture = document.createElement('div')
  fixture.innerHTML = `
    <div class="widget" data-widget-index="0"><div id="active-widget"></div></div>
    <div class="droppable-widget" data-drop-index="1" data-testid="invalid-after" hidden></div>
    <div class="dashboard-row-drop-target" data-drop-index="2" data-testid="target-row-after"></div>
  `
  document.body.append(fixture)
  for (const element of fixture.querySelectorAll<HTMLElement>('[data-drop-index]')) {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      bottom: 448,
      height: 48,
      left: 0,
      right: 600,
      top: 400,
      width: 600,
    } as DOMRect)
  }
})

afterEach(() => {
  fixture.remove()
  vi.restoreAllMocks()
})

function getArgs() {
  return {
    active: 'active-widget',
    context: {
      collisionRect: { height: 200, left: 0, top: 0, width: 600 },
      over: null,
      scrollableAncestors: [document.body],
    },
    currentCoordinates: { x: 0, y: 0 },
  } as unknown as Parameters<typeof droppableJumpKeyboardCoordinateGetter>[1]
}

it('should navigate to a row boundary and skip hidden side targets', () => {
  const event = new KeyboardEvent('keydown', { cancelable: true, code: 'ArrowDown' })
  const args = getArgs()

  expect(droppableJumpKeyboardCoordinateGetter(event, args)).toEqual({ x: 0, y: 324 })
  expect(event.defaultPrevented).toBe(true)
  expect(args.context.scrollableAncestors).toEqual([])
})

it('should remain in place when only hidden side targets exist', () => {
  fixture.querySelector('.dashboard-row-drop-target')!.remove()
  const event = new KeyboardEvent('keydown', { cancelable: true, code: 'ArrowDown' })
  const args = getArgs()

  expect(droppableJumpKeyboardCoordinateGetter(event, args)).toEqual(args.currentCoordinates)
})
