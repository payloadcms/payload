import type { WidgetWidth } from 'payload'

import { expect, it } from 'vitest'

import type { WidgetInstanceClient } from '../index.client.js'

import { resizeWidgetLayout } from './resizeWidgetLayout.js'

function widget({
  id,
  maxWidth = 'full',
  minWidth = 'x-small',
  width,
}: {
  id: string
  maxWidth?: WidgetWidth
  minWidth?: WidgetWidth
  width: WidgetWidth
}): WidgetInstanceClient {
  return { component: null, item: { id, maxWidth, minWidth, width } }
}

it('should shrink a sibling to fit the resized widget in its row', () => {
  const layout = [
    widget({ id: 'active', width: 'medium' }),
    widget({ id: 'sibling', width: 'medium' }),
  ]
  const result = resizeWidgetLayout({ layout, widgetID: 'active', width: 'large' })

  expect(result.map(({ item }) => item.width)).toEqual(['large', 'small'])
  expect(layout.map(({ item }) => item.width)).toEqual(['medium', 'medium'])
})

it('should shrink preceding siblings so the resized widget stays in its original row', () => {
  const layout = [
    widget({ id: 'sibling', width: 'medium' }),
    widget({ id: 'active', width: 'medium' }),
  ]
  const result = resizeWidgetLayout({ layout, widgetID: 'active', width: 'x-large' })

  expect(result.map(({ item }) => [item.id, item.width])).toEqual([
    ['sibling', 'x-small'],
    ['active', 'x-large'],
  ])
})

it('should wrap siblings below the resized widget when their minimum widths do not fit', () => {
  const layout = [
    widget({ id: 'sibling', width: 'medium', minWidth: 'medium' }),
    widget({ id: 'active', width: 'medium' }),
    widget({ id: 'next-row', width: 'full' }),
  ]
  const result = resizeWidgetLayout({ layout, widgetID: 'active', width: 'large' })

  expect(result.map(({ item }) => [item.id, item.width])).toEqual([
    ['active', 'large'],
    ['sibling', 'medium'],
    ['next-row', 'full'],
  ])
  expect(result[1]).toMatchObject(layout[0])
  expect(result[1].item.startsNewRow).toBe(true)
  expect(result[2]).toMatchObject(layout[2])
})

it('should keep fitting siblings in order and wrap only the overflow', () => {
  const layout = ['first', 'second', 'active', 'last'].map((id) => widget({ id, width: 'x-small' }))
  const result = resizeWidgetLayout({ layout, widgetID: 'active', width: 'medium' })

  expect(result.map(({ item }) => [item.id, item.width])).toEqual([
    ['first', 'x-small'],
    ['second', 'x-small'],
    ['active', 'medium'],
    ['last', 'x-small'],
  ])
})

it('should leave other rows and sibling widths unchanged when shrinking', () => {
  const layout = [
    widget({ id: 'previous-row', width: 'full' }),
    widget({ id: 'active', width: 'medium' }),
    widget({ id: 'sibling', width: 'medium' }),
    widget({ id: 'next-row', width: 'full' }),
  ]
  const result = resizeWidgetLayout({ layout, widgetID: 'active', width: 'x-small' })

  expect(result.map(({ item }) => item.width)).toEqual(['full', 'x-small', 'medium', 'full'])
  expect(result[0]).toBe(layout[0])
  expect(result[2]).toBe(layout[2])
  expect(result[3]).toMatchObject(layout[3])
})

it('should handle fractional widths without wrapping a fitting sibling', () => {
  const layout = ['first', 'active', 'last'].map((id) =>
    widget({ id, width: 'small', minWidth: 'small' }),
  )
  const result = resizeWidgetLayout({ layout, widgetID: 'active', width: 'small' })

  expect(result).toEqual(layout)
})

it('should clamp the resized widget to its configured limits', () => {
  const layout = [widget({ id: 'active', width: 'medium', minWidth: 'small', maxWidth: 'large' })]

  expect(resizeWidgetLayout({ layout, widgetID: 'active', width: 'full' })[0].item.width).toBe(
    'large',
  )
  expect(resizeWidgetLayout({ layout, widgetID: 'active', width: 'x-small' })[0].item.width).toBe(
    'small',
  )
})

it('should ignore a missing widget', () => {
  const layout = [widget({ id: 'active', width: 'medium' })]

  expect(resizeWidgetLayout({ layout, widgetID: 'missing', width: 'full' })).toBe(layout)
})

it('should transfer released space to the preceding sibling when shrinking from the start edge', () => {
  const layout = [
    widget({ id: 'previous', width: 'x-small' }),
    widget({ id: 'active', width: 'medium' }),
    widget({ id: 'following', width: 'x-small' }),
  ]
  const result = resizeWidgetLayout({ edge: 'start', layout, widgetID: 'active', width: 'x-small' })

  expect(result.map(({ item }) => [item.id, item.width])).toEqual([
    ['previous', 'medium'],
    ['active', 'x-small'],
    ['following', 'x-small'],
  ])
})

it('should cap the preceding sibling at its configured maximum', () => {
  const layout = [
    widget({ id: 'previous', width: 'x-small', maxWidth: 'small' }),
    widget({ id: 'active', width: 'large' }),
  ]

  expect(
    resizeWidgetLayout({ edge: 'start', layout, widgetID: 'active', width: 'x-small' }).map(
      ({ item }) => item.width,
    ),
  ).toEqual(['small', 'x-small'])
})

it('should leave the preceding sibling unchanged when no larger supported size fits', () => {
  const layout = [
    widget({ id: 'previous', width: 'medium' }),
    widget({ id: 'active', width: 'small' }),
  ]

  expect(
    resizeWidgetLayout({ edge: 'start', layout, widgetID: 'active', width: 'x-small' }).map(
      ({ item }) => item.width,
    ),
  ).toEqual(['medium', 'x-small'])
})

it('should not enlarge neighbors when shrinking from the end edge or a toolbar control', () => {
  const layout = [
    widget({ id: 'previous', width: 'medium' }),
    widget({ id: 'active', width: 'medium' }),
  ]

  for (const edge of ['end', undefined] as const) {
    expect(
      resizeWidgetLayout({ edge, layout, widgetID: 'active', width: 'x-small' }).map(
        ({ item }) => item.width,
      ),
    ).toEqual(['medium', 'x-small'])
  }
})

it('should not enlarge a preceding widget from a different row', () => {
  const layout = [
    widget({ id: 'previous', width: 'large' }),
    widget({ id: 'active', width: 'medium' }),
  ]

  expect(
    resizeWidgetLayout({ edge: 'start', layout, widgetID: 'active', width: 'x-small' }).map(
      ({ item }) => item.width,
    ),
  ).toEqual(['large', 'x-small'])
})

it('should preserve separate partial rows when resizing without changing adjacent rows', () => {
  const active = widget({ id: 'active', width: 'medium' })
  const following = widget({ id: 'following', width: 'medium' })
  const layout = [
    widget({ id: 'previous', width: 'x-small' }),
    { ...active, item: { ...active.item, startsNewRow: true } },
    { ...following, item: { ...following.item, startsNewRow: true } },
  ]
  const result = resizeWidgetLayout({
    edge: 'start',
    layout,
    widgetID: 'active',
    width: 'x-small',
  })

  expect(result.map(({ item }) => [item.id, item.width, Boolean(item.startsNewRow)])).toEqual([
    ['previous', 'x-small', false],
    ['active', 'x-small', true],
    ['following', 'medium', true],
  ])
})
