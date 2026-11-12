import type { WidgetWidth } from 'payload'

import { getWidgetIDFromDropTarget } from './getWidgetMoveIndexes.js'
import { WIDTH_TO_PERCENTAGE } from './resizeWidget.js'

/** Side indicators are valid only when the moved widget and its anchor will share a row. */
export function getValidSideDropTargets({
  activeID,
  layout,
}: {
  activeID: string
  layout: { id: string; width: WidgetWidth }[]
}): Set<string> {
  const active = layout.find(({ id }) => id === activeID)
  const targets = new Set<string>()

  if (!active) {
    return targets
  }

  for (const target of layout) {
    if (target.id === activeID) {
      continue
    }
    for (const position of ['before', 'after'] as const) {
      const proposed = layout.filter(({ id }) => id !== activeID)
      const index = proposed.findIndex(({ id }) => id === target.id)

      proposed.splice(index + (position === 'after' ? 1 : 0), 0, active)
      let row = 0
      let usedWidth = 0
      const widgetRows = new Map<string, number>()

      for (const widget of proposed) {
        const width = WIDTH_TO_PERCENTAGE[widget.width]

        if (usedWidth + width > 100 + 0.000001) {
          row++
          usedWidth = 0
        }
        widgetRows.set(widget.id, row)
        usedWidth += width
      }

      if (widgetRows.get(activeID) === widgetRows.get(target.id)) {
        targets.add(`${target.id}-${position}`)
      }
    }
  }

  return targets
}

export function isValidWidgetDropTarget({
  activeID,
  layout,
  overID,
}: {
  activeID: string
  layout: { id: string; width: WidgetWidth }[]
  overID: string
}): boolean {
  const widgetID = getWidgetIDFromDropTarget({ id: overID })

  if (!layout.some(({ id }) => id === activeID) || !layout.some(({ id }) => id === widgetID)) {
    return false
  }

  return (
    /-row-(?:before|after)$/.test(overID) ||
    getValidSideDropTargets({ activeID, layout }).has(overID)
  )
}
