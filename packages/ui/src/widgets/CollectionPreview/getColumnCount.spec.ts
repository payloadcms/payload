import { describe, expect, it } from 'vitest'

import { getColumnCount } from './getColumnCount.js'

describe('collection preview columns', () => {
  it.each([
    { width: 180, columns: 1 },
    { width: 240, columns: 1 },
    { width: 383, columns: 1 },
    { width: 384, columns: 2 },
    { width: 960, columns: 4 },
    { width: 1608, columns: 8 },
    { width: 4000, columns: 8 },
  ])('should fit $columns columns into $width pixels', ({ width, columns }) => {
    expect(getColumnCount({ width })).toBe(columns)
  })

  it('should retain one column when the widget is narrower than a card', () => {
    expect(getColumnCount({ width: 0 })).toBe(1)
  })
})
