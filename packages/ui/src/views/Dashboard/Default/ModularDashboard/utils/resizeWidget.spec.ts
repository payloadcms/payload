import { describe, expect, it } from 'vitest'

import { getResizedWidgetWidth } from './resizeWidget.js'

describe('widget edge resizing', () => {
  it.each([
    { delta: 0, expected: 'medium' },
    { delta: 20, expected: 'medium' },
    { delta: 190, expected: 'large' },
    { delta: 290, expected: 'x-large' },
    { delta: 700, expected: 'full' },
    { delta: -190, expected: 'small' },
    { delta: -300, expected: 'x-small' },
  ])('should snap a $delta pixel drag to $expected', ({ delta, expected }) => {
    expect(
      getResizedWidgetWidth({
        containerWidth: 1200,
        delta,
        maxWidth: 'full',
        minWidth: 'x-small',
        startWidth: 'medium',
      }),
    ).toBe(expected)
  })

  it.each([
    { delta: -1000, expected: 'small' },
    { delta: 1000, expected: 'large' },
  ])('should clamp a $delta pixel drag to the configured bounds', ({ delta, expected }) => {
    expect(
      getResizedWidgetWidth({
        containerWidth: 1200,
        delta,
        maxWidth: 'large',
        minWidth: 'small',
        startWidth: 'medium',
      }),
    ).toBe(expected)
  })

  it('should leave the width unchanged without a measurable container', () => {
    expect(
      getResizedWidgetWidth({
        containerWidth: 0,
        delta: 500,
        maxWidth: 'full',
        minWidth: 'x-small',
        startWidth: 'medium',
      }),
    ).toBe('medium')
  })
})
