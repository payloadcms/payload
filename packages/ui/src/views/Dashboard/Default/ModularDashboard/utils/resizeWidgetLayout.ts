import type { WidgetWidth } from 'payload'

import type { WidgetInstanceClient } from '../index.client.js'

import { WIDTH_TO_PERCENTAGE } from './resizeWidget.js'
import { flattenLayoutRows, getLayoutRows } from './widgetLayoutRows.js'

const EPSILON = 0.000001

/** Keep the resized widget in its original row, shrinking or wrapping its siblings as needed. */
export function resizeWidgetLayout({
  edge,
  layout,
  widgetID,
  width,
}: {
  edge?: 'end' | 'start'
  layout: WidgetInstanceClient[]
  widgetID: string
  width: WidgetWidth
}): WidgetInstanceClient[] {
  const activeIndex = layout.findIndex(({ item }) => item.id === widgetID)

  if (activeIndex < 0) {
    return layout
  }

  const active = layout[activeIndex]
  const options = (Object.keys(WIDTH_TO_PERCENTAGE) as WidgetWidth[]).filter(
    (option) =>
      WIDTH_TO_PERCENTAGE[option] >= WIDTH_TO_PERCENTAGE[active.item.minWidth] &&
      WIDTH_TO_PERCENTAGE[option] <= WIDTH_TO_PERCENTAGE[active.item.maxWidth],
  )
  const nextWidth = options.reduce(
    (nearest, option) =>
      Math.abs(WIDTH_TO_PERCENTAGE[option] - WIDTH_TO_PERCENTAGE[width]) <
      Math.abs(WIDTH_TO_PERCENTAGE[nearest] - WIDTH_TO_PERCENTAGE[width])
        ? option
        : nearest,
    options[0] ?? active.item.width,
  )
  if (nextWidth === active.item.width) {
    return layout
  }
  const rows = getLayoutRows({ getItem: ({ item }) => item, layout })
  const rowIndex = rows.findIndex((row) => row.some(({ item }) => item.id === widgetID))
  const row = rows[rowIndex]
  const widths = new Map<string, WidgetWidth>([[widgetID, nextWidth]])
  const overflow = new Set<string>()
  const siblings = row.filter(({ item }) => item.id !== widgetID)
  let available = 100 - WIDTH_TO_PERCENTAGE[nextWidth]
  const retained: WidgetInstanceClient[] = []

  for (const sibling of siblings) {
    const minimum = WIDTH_TO_PERCENTAGE[sibling.item.minWidth]

    if (minimum <= available + EPSILON) {
      retained.push(sibling)
      available -= minimum
    } else {
      overflow.add(sibling.item.id)
    }
  }

  // Reserve each sibling's minimum before assigning spare space in document order.
  for (const sibling of retained) {
    const minimum = WIDTH_TO_PERCENTAGE[sibling.item.minWidth]
    const budget = minimum + available
    const siblingWidth =
      (Object.keys(WIDTH_TO_PERCENTAGE) as WidgetWidth[])
        .filter(
          (option) =>
            WIDTH_TO_PERCENTAGE[option] >= minimum &&
            WIDTH_TO_PERCENTAGE[option] <= WIDTH_TO_PERCENTAGE[sibling.item.width] &&
            WIDTH_TO_PERCENTAGE[option] <= WIDTH_TO_PERCENTAGE[sibling.item.maxWidth] &&
            WIDTH_TO_PERCENTAGE[option] <= budget + EPSILON,
        )
        .at(-1) ?? sibling.item.minWidth

    widths.set(sibling.item.id, siblingWidth)
    available -= WIDTH_TO_PERCENTAGE[siblingWidth] - minimum
  }

  const previousSibling = row[row.findIndex(({ item }) => item.id === widgetID) - 1]
  const releasedWidth = WIDTH_TO_PERCENTAGE[active.item.width] - WIDTH_TO_PERCENTAGE[nextWidth]

  if (edge === 'start' && previousSibling && releasedWidth > EPSILON) {
    const previousWidth = widths.get(previousSibling.item.id)

    if (previousWidth) {
      const currentPercentage = WIDTH_TO_PERCENTAGE[previousWidth]
      const budget = Math.min(
        currentPercentage + available,
        WIDTH_TO_PERCENTAGE[previousSibling.item.width] + releasedWidth,
        WIDTH_TO_PERCENTAGE[previousSibling.item.maxWidth],
      )
      const expandedWidth = (Object.keys(WIDTH_TO_PERCENTAGE) as WidgetWidth[])
        .filter(
          (option) =>
            WIDTH_TO_PERCENTAGE[option] >= currentPercentage &&
            WIDTH_TO_PERCENTAGE[option] <= budget + EPSILON,
        )
        .at(-1)

      if (expandedWidth) {
        widths.set(previousSibling.item.id, expandedWidth)
      }
    }
  }

  const updatedRow = [
    ...row.filter(({ item }) => !overflow.has(item.id)),
    ...row.filter(({ item }) => overflow.has(item.id)),
  ].map((widget) => {
    const updatedWidth = widths.get(widget.item.id)

    return updatedWidth && updatedWidth !== widget.item.width
      ? { ...widget, item: { ...widget.item, width: updatedWidth } }
      : widget
  })

  const resizedRows = getLayoutRows({
    getItem: ({ item }) => ({ width: item.width }),
    layout: updatedRow,
  })

  rows.splice(rowIndex, 1, ...resizedRows)
  return flattenLayoutRows({ rows })
}
