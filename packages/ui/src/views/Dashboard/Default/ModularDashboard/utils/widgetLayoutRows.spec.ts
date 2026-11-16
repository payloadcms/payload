import type { WidgetWidth } from 'payload'

import { expect, it } from 'vitest'

import type { WidgetInstanceClient } from '../index.client.js'

import {
  flattenLayoutRows,
  getLayoutRows,
  placeWidgetInLayout,
  removeWidgetFromLayout,
} from './widgetLayoutRows.js'

function widget({
  id,
  startsNewRow,
  width = 'x-small',
}: {
  id: string
  startsNewRow?: boolean
  width?: WidgetWidth
}): WidgetInstanceClient {
  return {
    component: null,
    item: {
      id,
      width,
      minWidth: 'x-small',
      maxWidth: 'full',
      ...(startsNewRow ? { startsNewRow } : {}),
    },
  }
}
function rows({ layout }: { layout: WidgetInstanceClient[] }): string[][] {
  return getLayoutRows({ layout, getItem: ({ item }) => item }).map((row) =>
    row.map(({ item }) => item.id),
  )
}

it.each(['before', 'after'])(
  'should create a separate row %s an existing row even when there is room',
  (position) => {
    const layout = ['a', 'b', 'c'].map((id) => widget({ id }))
    const result = placeWidgetInLayout({ layout, overID: `b-row-${position}`, widget: layout[2] })

    expect(rows({ layout: result })).toEqual(
      position === 'before' ? [['c'], ['a', 'b']] : [['a', 'b'], ['c']],
    )
    expect(result.every(({ item }) => item.width === 'x-small')).toBe(true)
    expect(rows({ layout })).toEqual([['a', 'b', 'c']])
    expect(rows({ layout: JSON.parse(JSON.stringify(result)) })).toEqual(rows({ layout: result }))
  },
)

it('should keep the row break when placing a drawer widget before the first row', () => {
  const layout = [widget({ id: 'a' }), widget({ id: 'b' })]
  const result = placeWidgetInLayout({
    layout,
    widget: widget({ id: 'new' }),
    overID: 'a-row-before',
  })

  expect(rows({ layout: result })).toEqual([['new'], ['a', 'b']])
  expect(result[1].item.startsNewRow).toBe(true)
})

it('should remove a vacated row when joining another row and preserve the next row boundary', () => {
  const layout = [
    widget({ id: 'a' }),
    widget({ id: 'b', startsNewRow: true }),
    widget({ id: 'c', startsNewRow: true }),
  ]
  const result = placeWidgetInLayout({ layout, widget: layout[1], overID: 'a-after' })

  expect(rows({ layout: result })).toEqual([['a', 'b'], ['c']])
  expect(result[1].item.startsNewRow).toBeUndefined()
})

it('should transfer the start marker to the remaining sibling when moving the first widget out', () => {
  const layout = [
    widget({ id: 'previous', width: 'full' }),
    widget({ id: 'a', startsNewRow: true }),
    widget({ id: 'b' }),
    widget({ id: 'c', startsNewRow: true }),
  ]
  const result = placeWidgetInLayout({ layout, widget: layout[1], overID: 'c-after' })

  expect(rows({ layout: result })).toEqual([['previous'], ['b'], ['c', 'a']])
  expect(result.find(({ item }) => item.id === 'b')?.item.startsNewRow).toBe(true)
})

it('should discard empty rows when deleting their only widget, including the first row', () => {
  const layout = [
    widget({ id: 'a' }),
    widget({ id: 'b', startsNewRow: true }),
    widget({ id: 'c', startsNewRow: true }),
  ]
  const result = removeWidgetFromLayout({ layout, widgetID: 'b' })

  expect(rows({ layout: result })).toEqual([['a'], ['c']])
  const afterFirstRemoved = removeWidgetFromLayout({ layout: result, widgetID: 'a' })

  expect(rows({ layout: afterFirstRemoved })).toEqual([['c']])
  expect(afterFirstRemoved[0].item.startsNewRow).toBeUndefined()
  expect(removeWidgetFromLayout({ layout: afterFirstRemoved, widgetID: 'c' })).toEqual([])
})

it.each(['before', 'after'])(
  'should not create an empty row when dropping a sole widget %s its own row',
  (position) => {
    const layout = [widget({ id: 'a' }), widget({ id: 'b', startsNewRow: true })]

    expect(placeWidgetInLayout({ layout, widget: layout[1], overID: `b-row-${position}` })).toBe(
      layout,
    )
  },
)

it('should resize and join a full-width target without disturbing a previous partial row', () => {
  const layout = [
    widget({ id: 'previous' }),
    widget({ id: 'target', width: 'full' }),
    widget({ id: 'active' }),
  ]
  const result = placeWidgetInLayout({
    layout,
    widget: layout[2],
    overID: 'target-before',
    resizeTarget: { widgetID: 'target', width: 'x-large' },
  })

  expect(rows({ layout: result })).toEqual([['previous'], ['active', 'target']])
  expect(result.find(({ item }) => item.id === 'target')?.item.width).toBe('x-large')
})

it('should never emit an empty row from malformed or vacated row groups', () => {
  const result = flattenLayoutRows({
    rows: [[], [widget({ id: 'a', startsNewRow: true })], [], [widget({ id: 'b' })], []],
  })

  expect(rows({ layout: result })).toEqual([['a'], ['b']])
  expect(result[0].item.startsNewRow).toBeUndefined()
})
