import type { WidgetWidth } from 'payload'

import type { WidgetInstanceClient } from '../index.client.js'

import { getWidgetIDFromDropTarget } from './getWidgetMoveIndexes.js'
import { WIDTH_TO_PERCENTAGE } from './resizeWidget.js'

export type RowItem = { startsNewRow?: boolean; width: WidgetWidth }

export function getLayoutRows<T>({
  getItem,
  layout,
}: {
  getItem: (widget: T) => RowItem
  layout: T[]
}): T[][] {
  const rows: T[][] = []
  let usedWidth = 0

  for (const widget of layout) {
    const item = getItem(widget)
    const width = WIDTH_TO_PERCENTAGE[item.width]

    if (!rows.length || item.startsNewRow || usedWidth + width > 100 + 0.000001) {
      rows.push([])
      usedWidth = 0
    }
    rows[rows.length - 1].push(widget)
    usedWidth += width
  }

  return rows
}

/** Row starts belong to their first widget, so an empty row cannot be persisted. */
export function flattenLayoutRows({
  rows,
}: {
  rows: WidgetInstanceClient[][]
}): WidgetInstanceClient[] {
  return rows
    .filter((row) => row.length > 0)
    .flatMap((row, rowIndex) =>
      row.map((widget, index) => {
        const startsNewRow = rowIndex > 0 && index === 0

        if (Boolean(widget.item.startsNewRow) === startsNewRow) {
          return widget
        }
        const { startsNewRow: _, ...item } = widget.item

        return { ...widget, item: { ...item, ...(startsNewRow ? { startsNewRow: true } : {}) } }
      }),
    )
}

/** Place a widget beside an anchor or on a separate row; compact away any vacated row. */
export function placeWidgetInLayout({
  layout,
  overID,
  resizeTarget,
  widget,
}: {
  layout: WidgetInstanceClient[]
  overID: string
  resizeTarget?: { widgetID: string; width: WidgetWidth }
  widget: WidgetInstanceClient
}): WidgetInstanceClient[] {
  if (layout.length === 0) {
    return flattenLayoutRows({ rows: [[widget]] })
  }
  const targetID = getWidgetIDFromDropTarget({ id: overID })
  const rows = getLayoutRows({ getItem: ({ item }) => item, layout })
  const targetRowIndex = rows.findIndex((row) => row.some(({ item }) => item.id === targetID))

  if (targetRowIndex < 0) {
    return layout
  }
  const nextRows = rows.map((row) =>
    row
      .filter(({ item }) => item.id !== widget.item.id)
      .map((entry) =>
        entry.item.id === resizeTarget?.widgetID
          ? { ...entry, item: { ...entry.item, width: resizeTarget.width } }
          : entry,
      ),
  )
  const targetRow = nextRows[targetRowIndex]
  const isAfter = overID.endsWith('-after')

  if (/-row-(?:before|after)$/.test(overID)) {
    if (targetRow.length === 0) {
      return layout
    }
    nextRows.splice(targetRowIndex + (isAfter ? 1 : 0), 0, [widget])
  } else {
    const targetIndex = targetRow.findIndex(({ item }) => item.id === targetID)

    if (targetIndex < 0) {
      return layout
    }
    targetRow.splice(targetIndex + (isAfter ? 1 : 0), 0, widget)
    const reflowed = getLayoutRows({
      getItem: ({ item }) => ({ width: item.width }),
      layout: targetRow,
    })

    nextRows.splice(targetRowIndex, 1, ...reflowed)
  }

  const occupiedRows = nextRows.filter((row) => row.length > 0)
  const hasSameRows =
    rows.length === occupiedRows.length &&
    rows.every(
      (row, rowIndex) =>
        row.length === occupiedRows[rowIndex].length &&
        row.every(
          ({ item }, index) =>
            item.id === occupiedRows[rowIndex][index].item.id &&
            item.width === occupiedRows[rowIndex][index].item.width,
        ),
    )

  return hasSameRows ? layout : flattenLayoutRows({ rows: occupiedRows })
}

export function removeWidgetFromLayout({
  layout,
  widgetID,
}: {
  layout: WidgetInstanceClient[]
  widgetID: string
}): WidgetInstanceClient[] {
  if (!layout.some(({ item }) => item.id === widgetID)) {
    return layout
  }
  const rows = getLayoutRows({ getItem: ({ item }) => item, layout })

  return flattenLayoutRows({
    rows: rows.map((row) => row.filter(({ item }) => item.id !== widgetID)),
  })
}
