import { expect, it } from 'vitest'

import {
  getValidSideDropTargets,
  getWidgetDropSizing,
  getWidgetDropWidth,
  isValidWidgetDropTarget,
} from './getValidSideDropTargets.js'

it.each([
  { activeWidth: 'full', targetWidth: 'large', isAllowed: true },
  { activeWidth: 'full', targetWidth: 'x-small', isAllowed: true },
  { activeWidth: 'x-small', targetWidth: 'full', isAllowed: true },
  { activeWidth: 'medium', targetWidth: 'medium', isAllowed: true },
  { activeWidth: 'small', targetWidth: 'large', isAllowed: true },
  { activeWidth: 'x-small', targetWidth: 'x-large', isAllowed: true },
  { activeWidth: 'x-large', targetWidth: 'small', isAllowed: true },
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
  { expected: true, overID: 'target-before' },
  { expected: true, overID: 'target-after' },
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

it.each([
  { activeWidth: 'full', targetWidth: 'large', expected: 'small' },
  { activeWidth: 'x-small', targetWidth: 'medium', expected: 'medium' },
  { activeWidth: 'full', targetWidth: 'x-small', expected: 'x-large' },
] as const)(
  'should resize $activeWidth to $expected beside $targetWidth',
  ({ activeWidth, targetWidth, expected }) => {
    // The full-width separator keeps the source and destination in different rows.
    const layout = [
      { id: 'active', width: activeWidth },
      { id: 'separator', width: 'full' as const },
      { id: 'target', width: targetWidth },
    ]

    for (const position of ['before', 'after']) {
      expect(getWidgetDropWidth({ activeID: 'active', layout, overID: `target-${position}` })).toBe(
        expected,
      )
    }
    expect(getWidgetDropWidth({ activeID: 'active', layout, overID: 'target-row-after' })).toBe(
      activeWidth,
    )
  },
)

it('should use the total occupied width of the destination row', () => {
  expect(
    getWidgetDropWidth({
      activeID: 'active',
      layout: [
        { id: 'active', width: 'full' },
        { id: 'first', width: 'x-small' },
        { id: 'target', width: 'medium' },
      ],
      overID: 'target-after',
    }),
  ).toBe('x-small')
})

it('should reject a row gap smaller than the configured minimum', () => {
  const layout = [
    { id: 'active', width: 'full' as const, minWidth: 'medium' as const },
    { id: 'target', width: 'large' as const },
  ]

  expect(getValidSideDropTargets({ activeID: 'active', layout }).size).toBe(0)
  expect(getWidgetDropWidth({ activeID: 'active', layout, overID: 'target-after' })).toBeNull()
})

it('should cap the automatic width at the configured maximum', () => {
  expect(
    getWidgetDropWidth({
      activeID: 'active',
      layout: [
        { id: 'active', width: 'x-small', maxWidth: 'medium' },
        { id: 'separator', width: 'full' },
        { id: 'target', width: 'x-small' },
      ],
      overID: 'target-after',
    }),
  ).toBe('medium')
})

it('should preserve width when reordering within the same row', () => {
  expect(
    getWidgetDropWidth({
      activeID: 'active',
      layout: [
        { id: 'active', width: 'x-small' },
        { id: 'target', width: 'medium' },
      ],
      overID: 'target-after',
    }),
  ).toBe('x-small')
})

it.each(['before', 'after'])(
  'should resize a flexible full-width target when dropping %s it',
  (position) => {
    const layout = [
      { id: 'active', width: 'x-small' as const },
      { id: 'target', width: 'full' as const, minWidth: 'medium' as const },
    ]

    expect(
      getWidgetDropSizing({ activeID: 'active', layout, overID: `target-${position}` }),
    ).toEqual({
      width: 'x-small',
      resizeTarget: { widgetID: 'target', width: 'x-large' },
    })
    expect(layout[1].width).toBe('full')
  },
)

it('should split two flexible full-width widgets evenly', () => {
  expect(
    getWidgetDropSizing({
      activeID: 'active',
      layout: [
        { id: 'active', width: 'full' },
        { id: 'target', width: 'full' },
      ],
      overID: 'target-after',
    }),
  ).toEqual({ width: 'medium', resizeTarget: { widgetID: 'target', width: 'medium' } })
})

it('should respect both minimum widths when sharing a full-width row', () => {
  expect(
    getWidgetDropSizing({
      activeID: 'active',
      layout: [
        { id: 'active', width: 'full', minWidth: 'large' },
        { id: 'target', width: 'full', minWidth: 'small' },
      ],
      overID: 'target-after',
    }),
  ).toEqual({ width: 'large', resizeTarget: { widgetID: 'target', width: 'small' } })
})

it('should expose only row boundaries beside a widget restricted to full width', () => {
  const layout = [
    { id: 'active', width: 'x-small' as const },
    { id: 'target', width: 'full' as const, minWidth: 'full' as const, maxWidth: 'full' as const },
  ]

  expect(getValidSideDropTargets({ activeID: 'active', layout }).size).toBe(0)
  expect(getWidgetDropSizing({ activeID: 'active', layout, overID: 'target-row-after' })).toEqual({
    width: 'x-small',
  })
})

it('should reject a split when the combined minimum widths exceed a row', () => {
  expect(
    getWidgetDropSizing({
      activeID: 'active',
      layout: [
        { id: 'active', width: 'full', minWidth: 'large' },
        { id: 'target', width: 'full', minWidth: 'large' },
      ],
      overID: 'target-after',
    }),
  ).toBeNull()
})

it('should leave full-width targets unchanged for row-boundary drops', () => {
  expect(
    getWidgetDropSizing({
      activeID: 'active',
      layout: [
        { id: 'active', width: 'full' },
        { id: 'target', width: 'full' },
      ],
      overID: 'target-row-before',
    }),
  ).toEqual({ width: 'full' })
})
