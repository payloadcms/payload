export type WidgetRow = {
  bottom: number
  firstWidgetID: string
  lastWidgetID: string
  top: number
}

export function getWidgetRows({
  widgets,
}: {
  widgets: { bottom: number; id: string; top: number }[]
}): WidgetRow[] {
  const rows: WidgetRow[] = []

  for (const widget of widgets) {
    const row = rows.at(-1)

    if (row && Math.abs(row.top - widget.top) <= 1) {
      row.bottom = Math.max(row.bottom, widget.bottom)
      row.lastWidgetID = widget.id
    } else {
      rows.push({
        bottom: widget.bottom,
        firstWidgetID: widget.id,
        lastWidgetID: widget.id,
        top: widget.top,
      })
    }
  }

  return rows
}
