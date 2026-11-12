import { expect, it } from 'vitest'

import { getKeyboardDropTarget } from './getKeyboardDropTarget.js'

const rowTargets = [
  { id: 'above', index: 0, x: 300, y: 0 },
  { id: 'below', index: 2, x: 300, y: 400 },
]

it.each([
  { direction: 'ArrowRight', expected: 'below', isRTL: false },
  { direction: 'ArrowLeft', expected: 'above', isRTL: false },
  { direction: 'ArrowRight', expected: 'above', isRTL: true },
  { direction: 'ArrowLeft', expected: 'below', isRTL: true },
  { direction: 'ArrowDown', expected: 'below', isRTL: false },
  { direction: 'ArrowUp', expected: 'above', isRTL: false },
])(
  'should reach $expected using $direction with only row targets available',
  ({ direction, expected, isRTL }) => {
    expect(
      getKeyboardDropTarget({
        currentIndex: 1,
        direction,
        isRTL,
        targets: rowTargets,
        x: 300,
        y: 200,
      })?.id,
    ).toBe(expected)
  },
)

it('should prefer the nearest valid representation of the next insertion index', () => {
  expect(
    getKeyboardDropTarget({
      currentIndex: 1,
      direction: 'ArrowRight',
      isRTL: false,
      targets: [...rowTargets, { id: 'side', index: 2, x: 400, y: 200 }],
      x: 300,
      y: 200,
    })?.id,
  ).toBe('side')
})

it('should remain in place when no valid target exists in that direction', () => {
  expect(
    getKeyboardDropTarget({
      currentIndex: 2,
      direction: 'ArrowRight',
      isRTL: false,
      targets: rowTargets,
      x: 300,
      y: 400,
    }),
  ).toBeUndefined()
})
