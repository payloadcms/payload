import { expect, it } from 'vitest'

import { getValidSideDropTargets, isValidWidgetDropTarget } from './getValidSideDropTargets.js'

it.each([
  { activeWidth: 'full', targetWidth: 'large', isAllowed: false },
  { activeWidth: 'full', targetWidth: 'x-small', isAllowed: false },
  { activeWidth: 'x-small', targetWidth: 'full', isAllowed: false },
  { activeWidth: 'medium', targetWidth: 'medium', isAllowed: true },
  { activeWidth: 'small', targetWidth: 'large', isAllowed: true },
  { activeWidth: 'x-small', targetWidth: 'x-large', isAllowed: true },
  { activeWidth: 'x-large', targetWidth: 'small', isAllowed: false },
] as const)(
  'should allow side drops for $activeWidth beside $targetWidth: $isAllowed',
  ({ activeWidth, isAllowed, targetWidth }) => {
    const targets = getValidSideDropTargets({
      activeID: 'active',
      layout: [
        { id: 'active', width: activeWidth },
        { id: 'target', width: targetWidth },
      ],
    })

    expect(targets.has('target-before')).toBe(isAllowed)
    expect(targets.has('target-after')).toBe(isAllowed)
    expect(targets.has('active-before')).toBe(false)
    expect(targets.has('active-after')).toBe(false)
  },
)

it('should reject side drops that wrap apart because of other widgets in the row', () => {
  const targets = getValidSideDropTargets({
    activeID: 'active',
    layout: [
      { id: 'first', width: 'x-small' },
      { id: 'target', width: 'large' },
      { id: 'active', width: 'x-small' },
    ],
  })

  expect(targets.has('target-before')).toBe(false)
  expect(targets.has('target-after')).toBe(false)
})

it('should retain side drops that reflow trailing widgets while keeping the anchor beside the moved widget', () => {
  const targets = getValidSideDropTargets({
    activeID: 'active',
    layout: [
      { id: 'target', width: 'medium' },
      { id: 'trailing', width: 'medium' },
      { id: 'active', width: 'x-small' },
    ],
  })

  expect(targets.has('target-before')).toBe(true)
  expect(targets.has('target-after')).toBe(true)
  expect(targets.has('trailing-before')).toBe(false)
  expect(targets.has('trailing-after')).toBe(false)
})

it('should allow three one-third widgets to share a row without rounding errors', () => {
  const targets = getValidSideDropTargets({
    activeID: 'active',
    layout: [
      { id: 'active', width: 'small' },
      { id: 'second', width: 'small' },
      { id: 'third', width: 'small' },
    ],
  })

  expect(targets.size).toBe(4)
})

it('should expose no side targets when the dragged widget is missing', () => {
  expect(getValidSideDropTargets({ activeID: 'missing', layout: [] }).size).toBe(0)
})

it.each([
  { expected: false, overID: 'target-before' },
  { expected: false, overID: 'target-after' },
  { expected: true, overID: 'target-row-before' },
  { expected: true, overID: 'target-row-after' },
])(
  'should validate a full-width widget drop on $overID as $expected even with a stale collision',
  ({ expected, overID }) => {
    expect(
      isValidWidgetDropTarget({
        activeID: 'active',
        layout: [
          { id: 'active', width: 'full' },
          { id: 'target', width: 'large' },
        ],
        overID,
      }),
    ).toBe(expected)
  },
)
