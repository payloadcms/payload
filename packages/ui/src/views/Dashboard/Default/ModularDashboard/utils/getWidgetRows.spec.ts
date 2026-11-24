import { expect, it } from 'vitest'

import { getWidgetRows } from './getWidgetRows.js'

it('should group widgets by rendered row and retain the tallest row boundary', () => {
  expect(
    getWidgetRows({
      widgets: [
        { bottom: 140, id: 'first', top: 0 },
        { bottom: 200, id: 'second', top: 0.5 },
        { bottom: 350, id: 'third', top: 200 },
        { bottom: 330, id: 'fourth', top: 200 },
      ],
    }),
  ).toEqual([
    { bottom: 200, firstWidgetID: 'first', lastWidgetID: 'second', top: 0 },
    { bottom: 350, firstWidgetID: 'third', lastWidgetID: 'fourth', top: 200 },
  ])
})

it('should preserve DOM insertion order for rows rendered in either text direction', () => {
  expect(
    getWidgetRows({
      widgets: [
        { bottom: 100, id: 'inline-start', top: 0 },
        { bottom: 100, id: 'inline-end', top: 0 },
      ],
    }),
  ).toEqual([{ bottom: 100, firstWidgetID: 'inline-start', lastWidgetID: 'inline-end', top: 0 }])
})

it('should return no row targets for an empty dashboard', () => {
  expect(getWidgetRows({ widgets: [] })).toEqual([])
})
