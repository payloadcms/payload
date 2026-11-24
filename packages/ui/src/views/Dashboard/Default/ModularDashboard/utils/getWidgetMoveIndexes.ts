import type { UniqueIdentifier } from '@dnd-kit/core'

import type { WidgetInstanceClient } from '../index.client.js'

export function getWidgetIDFromDropTarget({ id }: { id: UniqueIdentifier }): string {
  return String(id).replace(/-(?:row-)?(?:before|after)$/, '')
}

export function getWidgetMoveIndexes({
  activeID,
  layout,
  overID,
}: {
  activeID: UniqueIdentifier
  layout: WidgetInstanceClient[]
  overID: UniqueIdentifier
}) {
  const widgetID = getWidgetIDFromDropTarget({ id: overID })
  const moveFromIndex = layout.findIndex((widget) => widget.item.id === activeID)
  let moveToIndex = layout.findIndex((widget) => widget.item.id === widgetID)

  if (widgetID !== activeID) {
    if (moveFromIndex < moveToIndex) {
      moveToIndex--
    }
    if (String(overID).endsWith('-after')) {
      moveToIndex++
    }
  }

  return { moveFromIndex, moveToIndex }
}
