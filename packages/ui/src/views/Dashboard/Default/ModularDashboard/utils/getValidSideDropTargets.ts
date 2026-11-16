import type { WidgetWidth } from 'payload'

import { getWidgetIDFromDropTarget } from './getWidgetMoveIndexes.js'
import { WIDTH_TO_PERCENTAGE } from './resizeWidget.js'

type DropWidget = {
  id: string
  maxWidth?: WidgetWidth
  minWidth?: WidgetWidth
  width: WidgetWidth
}

export type WidgetDropSizing = {
  resizeTarget?: { widgetID: string; width: WidgetWidth }
  width: WidgetWidth
}

type DropArgs = {
  activeID: string
  activeWidget?: DropWidget
  layout: DropWidget[]
  overID: string
}

const WIDTH_EPSILON = 0.000001

export function getValidSideDropTargets({
  activeID,
  activeWidget,
  layout,
}: {
  activeID: string
  activeWidget?: DropWidget
  layout: DropWidget[]
}): Set<string> {
  const targets = new Set<string>()

  for (const target of layout) {
    if (target.id === activeID) {
      continue
    }
    for (const position of ['before', 'after'] as const) {
      const overID = `${target.id}-${position}`

      if (getWidgetDropWidth({ activeID, activeWidget, layout, overID }) !== null) {
        targets.add(overID)
      }
    }
  }

  return targets
}

export function getWidgetDropWidth(args: DropArgs): null | WidgetWidth {
  return getWidgetDropSizing(args)?.width ?? null
}

/** Side drops share row space; row-boundary drops retain the widget's width. */
export function getWidgetDropSizing({
  activeID,
  activeWidget,
  layout,
  overID,
}: DropArgs): null | WidgetDropSizing {
  const active = layout.find(({ id }) => id === activeID) ?? activeWidget
  const targetID = getWidgetIDFromDropTarget({ id: overID })
  const target = layout.find(({ id }) => id === targetID)

  if (!active || !target) {
    return null
  }
  if (/-row-(?:before|after)$/.test(overID)) {
    return { width: active.width }
  }
  if (activeID === targetID || !/-(?:before|after)$/.test(overID)) {
    return null
  }

  if (target.width === 'full') {
    const candidates: Required<WidgetDropSizing>[] = []
    const preferredWidth = active.width === 'full' ? 50 : WIDTH_TO_PERCENTAGE[active.width]

    for (const width of getAllowedWidths({ widget: active })) {
      for (const targetWidth of getAllowedWidths({ widget: target })) {
        if (WIDTH_TO_PERCENTAGE[width] + WIDTH_TO_PERCENTAGE[targetWidth] > 100 + WIDTH_EPSILON) {
          continue
        }
        const proposed = layout
          .filter(({ id }) => id !== activeID)
          .map((widget) => (widget.id === targetID ? { ...widget, width: targetWidth } : widget))
        const index = proposed.findIndex(({ id }) => id === targetID)

        proposed.splice(index + (overID.endsWith('-after') ? 1 : 0), 0, { ...active, width })
        if (
          getRows({ layout: proposed }).some(
            (row) => row.some(({ id }) => id === activeID) && row.some(({ id }) => id === targetID),
          )
        ) {
          candidates.push({ resizeTarget: { widgetID: targetID, width: targetWidth }, width })
        }
      }
    }

    return (
      candidates.sort(
        (a, b) =>
          Math.abs(WIDTH_TO_PERCENTAGE[a.width] - preferredWidth) -
            Math.abs(WIDTH_TO_PERCENTAGE[b.width] - preferredWidth) ||
          WIDTH_TO_PERCENTAGE[b.resizeTarget.width] - WIDTH_TO_PERCENTAGE[a.resizeTarget.width],
      )[0] ?? null
    )
  }

  const rows = getRows({ layout })
  const targetRow = rows.find((row) => row.some(({ id }) => id === targetID))!
  let width = active.width

  if (!targetRow.some(({ id }) => id === activeID)) {
    const remaining =
      100 - targetRow.reduce((total, widget) => total + WIDTH_TO_PERCENTAGE[widget.width], 0)

    if (remaining > WIDTH_EPSILON) {
      const options = (Object.keys(WIDTH_TO_PERCENTAGE) as WidgetWidth[]).filter(
        (option) =>
          WIDTH_TO_PERCENTAGE[option] <= remaining + WIDTH_EPSILON &&
          WIDTH_TO_PERCENTAGE[option] >= WIDTH_TO_PERCENTAGE[active.minWidth ?? 'x-small'] &&
          WIDTH_TO_PERCENTAGE[option] <= WIDTH_TO_PERCENTAGE[active.maxWidth ?? 'full'],
      )

      if (!options.length) {
        return null
      }
      width = options[options.length - 1]
    }
  }

  const proposed = layout.filter(({ id }) => id !== activeID)
  const index = proposed.findIndex(({ id }) => id === targetID)

  proposed.splice(index + (overID.endsWith('-after') ? 1 : 0), 0, { ...active, width })

  return getRows({ layout: proposed }).some(
    (row) => row.some(({ id }) => id === activeID) && row.some(({ id }) => id === targetID),
  )
    ? { width }
    : null
}

export function isValidWidgetDropTarget(args: {
  activeID: string
  activeWidget?: DropWidget
  layout: DropWidget[]
  overID: string
}): boolean {
  return getWidgetDropWidth(args) !== null
}

function getRows({ layout }: { layout: DropWidget[] }): DropWidget[][] {
  const rows: DropWidget[][] = []
  let usedWidth = 0

  for (const widget of layout) {
    const width = WIDTH_TO_PERCENTAGE[widget.width]

    if (!rows.length || usedWidth + width > 100 + WIDTH_EPSILON) {
      rows.push([])
      usedWidth = 0
    }
    rows[rows.length - 1].push(widget)
    usedWidth += width
  }

  return rows
}

function getAllowedWidths({ widget }: { widget: DropWidget }): WidgetWidth[] {
  return (Object.keys(WIDTH_TO_PERCENTAGE) as WidgetWidth[]).filter(
    (width) =>
      WIDTH_TO_PERCENTAGE[width] >= WIDTH_TO_PERCENTAGE[widget.minWidth ?? 'x-small'] &&
      WIDTH_TO_PERCENTAGE[width] <= WIDTH_TO_PERCENTAGE[widget.maxWidth ?? 'full'],
  )
}
