import { expect, it } from 'vitest'

import type { WidgetInstanceClient } from '../index.client.js'

import { getWidgetIDFromDropTarget, getWidgetMoveIndexes } from './getWidgetMoveIndexes.js'

const layout: WidgetInstanceClient[] = ['a-1', 'b-2', 'c-3', 'd-4'].map((id) => ({
  component: null,
  item: { id, maxWidth: 'full', minWidth: 'x-small', width: 'small' },
}))

it.each([
  { activeID: 'a-1', moveToIndex: 1, overID: 'c-3-row-before' },
  { activeID: 'a-1', moveToIndex: 2, overID: 'c-3-row-after' },
  { activeID: 'd-4', moveToIndex: 1, overID: 'b-2-row-before' },
  { activeID: 'd-4', moveToIndex: 2, overID: 'b-2-row-after' },
  { activeID: 'b-2', moveToIndex: 1, overID: 'b-2-row-before' },
  { activeID: 'a-1', moveToIndex: 2, overID: 'c-3-after' },
])('should map $overID to insertion position $moveToIndex', ({ activeID, moveToIndex, overID }) => {
  expect(getWidgetMoveIndexes({ activeID, layout, overID })).toEqual({
    moveFromIndex: layout.findIndex(({ item }) => item.id === activeID),
    moveToIndex,
  })
})

it.each(['before', 'after', 'row-before', 'row-after'])(
  'should resolve %s targets for widget announcements',
  (suffix) => {
    expect(getWidgetIDFromDropTarget({ id: `collection-preview-uuid-${suffix}` })).toBe(
      'collection-preview-uuid',
    )
  },
)
