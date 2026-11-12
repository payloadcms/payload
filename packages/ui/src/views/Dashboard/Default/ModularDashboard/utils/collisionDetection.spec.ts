import { expect, it } from 'vitest'

import { closestInXAxis } from './collisionDetection.js'

function detect({
  isAtStart = false,
  isKeyboard = false,
  x,
  y,
}: {
  isAtStart?: boolean
  isKeyboard?: boolean
  x: number
  y: number
}) {
  const targets = [
    {
      id: 'first-before',
      position: 'before',
      rect: { bottom: 200, height: 200, left: 0, right: 4, top: 0, width: 4 },
    },
    {
      id: 'second-after',
      position: 'after',
      rect: { bottom: 200, height: 200, left: 596, right: 600, top: 0, width: 4 },
    },
    {
      id: 'first-row-before',
      position: 'row-before',
      rect: { bottom: 24, height: 48, left: 0, right: 600, top: -24, width: 600 },
    },
    {
      id: 'second-row-after',
      position: 'row-after',
      rect: { bottom: 224, height: 48, left: 0, right: 600, top: 176, width: 600 },
    },
  ]

  return closestInXAxis({
    active: isAtStart
      ? { rect: { current: { initial: { height: 20, left: x - 10, top: y - 10, width: 20 } } } }
      : undefined,
    collisionRect: { height: 20, left: x - 10, top: y - 10, width: 20 },
    droppableContainers: targets.map(({ id, position }) => ({
      id,
      data: { current: { position } },
    })),
    droppableRects: new Map(targets.map(({ id, rect }) => [id, rect])),
    pointerCoordinates: isKeyboard ? null : { x, y },
  } as unknown as Parameters<typeof closestInXAxis>[0])[0]?.id
}

it.each([
  { expected: 'first-row-before', x: 300, y: 5 },
  { expected: 'second-row-after', x: 300, y: 195 },
  { expected: 'second-row-after', x: 300, y: 220 },
])('should choose $expected near a row boundary', ({ expected, x, y }) => {
  expect(detect({ x, y })).toBe(expected)
})

it.each([
  { expected: 'first-before', x: 10, y: 100 },
  { expected: 'second-after', x: 590, y: 100 },
  { expected: 'second-after', x: 650, y: 195 },
])('should retain widget-edge targeting away from row hit areas', ({ expected, x, y }) => {
  expect(detect({ x, y })).toBe(expected)
})

it('should preserve keyboard navigation to existing widget edges', () => {
  expect(detect({ isKeyboard: true, x: 590, y: 195 })).toBe('second-after')
})

it('should not choose a target outside every row', () => {
  expect(detect({ x: 300, y: 300 })).toBeUndefined()
})

it('should allow keyboard dragging to land on row targets when side targets cannot fit', () => {
  expect(detect({ isKeyboard: true, x: 300, y: 200 })).toBe('second-row-after')
})

it('should leave keyboard pickup in place until an arrow key moves the widget', () => {
  expect(detect({ isAtStart: true, isKeyboard: true, x: 300, y: 200 })).toBeUndefined()
})
