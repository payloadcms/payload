import type { ClientWidget } from 'payload'

import { expect, it } from 'vitest'

import type { WidgetItem } from '../index.client.js'

import {
  EMPTY_DASHBOARD_DROP_ID,
  getDrawerWidgetDragData,
  getDrawerWidgetDrop,
  getDrawerWidgetItem,
} from './getDrawerWidgetDrop.js'
import { getValidSideDropTargets } from './getValidSideDropTargets.js'

const widget: ClientWidget = { slug: 'count', minWidth: 'x-small', maxWidth: 'medium' }
const layout: WidgetItem[] = [
  { id: 'target-1', width: 'large', minWidth: 'x-small', maxWidth: 'full' },
]

it.each([
  { overID: 'target-1-before', expected: { index: 0, width: 'small' } },
  { overID: 'target-1-after', expected: { index: 1, width: 'small' } },
  { overID: 'target-1-row-before', expected: { index: 0, width: 'x-small' } },
  { overID: 'target-1-row-after', expected: { index: 1, width: 'x-small' } },
  { overID: 'missing-after', expected: null },
])('should insert a drawer widget at $overID', ({ overID, expected }) => {
  expect(getDrawerWidgetDrop({ layout, overID, widget })).toEqual(expected)
})

it('should expose fitting side targets for a widget not yet in the layout', () => {
  const activeWidget = getDrawerWidgetItem({ widget })

  expect([...getValidSideDropTargets({ activeID: activeWidget.id, activeWidget, layout })]).toEqual(
    ['target-1-before', 'target-1-after'],
  )
})

it('should reject side drops when the widget minimum does not fit', () => {
  expect(
    getDrawerWidgetDrop({
      layout,
      widget: { ...widget, minWidth: 'medium' },
      overID: 'target-1-after',
    }),
  ).toBeNull()
})

it('should insert into an empty dashboard at the configured minimum', () => {
  expect(
    getDrawerWidgetDrop({
      layout: [],
      overID: EMPTY_DASHBOARD_DROP_ID,
      widget: { ...widget, minWidth: 'medium' },
    }),
  ).toEqual({ index: 0, width: 'medium' })
  expect(getDrawerWidgetDrop({ layout, overID: EMPTY_DASHBOARD_DROP_ID, widget })).toBeNull()
})

it('should cap fitted width at the widget maximum', () => {
  const target: WidgetItem = { ...layout[0], width: 'x-small' }

  expect(getDrawerWidgetDrop({ layout: [target], widget, overID: 'target-1-after' })).toEqual({
    index: 1,
    width: 'medium',
  })
})

it('should recognize drawer data and ignore ordinary widget drags', () => {
  const data = { type: 'dashboard-widget', drawerSlug: 'widgets', widget }

  expect(getDrawerWidgetDragData({ data })).toBe(data)
  expect(getDrawerWidgetDragData({ data: {} })).toBeNull()
  expect(getDrawerWidgetDragData({ data: undefined })).toBeNull()
})

it('should include the resized target when adding beside a flexible full-width widget', () => {
  expect(
    getDrawerWidgetDrop({
      layout: [{ id: 'target', width: 'full', minWidth: 'x-small', maxWidth: 'full' }],
      overID: 'target-after',
      widget,
    }),
  ).toEqual({ index: 1, width: 'x-small', resizeTarget: { widgetID: 'target', width: 'x-large' } })
})
