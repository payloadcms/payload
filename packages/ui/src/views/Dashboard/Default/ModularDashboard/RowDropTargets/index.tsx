'use client'

import type { RefObject } from 'react'

import { useLayoutEffect, useState } from 'react'

import type { WidgetInstanceClient } from '../index.client.js'
import type { WidgetRow } from '../utils/getWidgetRows.js'

import { RowDropTarget } from '../RowDropTarget/index.js'
import { getWidgetRows } from '../utils/getWidgetRows.js'
import './index.css'

export function RowDropTargets({
  dashboardRef,
  layout,
}: {
  dashboardRef: RefObject<HTMLDivElement | null>
  layout: WidgetInstanceClient[]
}) {
  const [rows, setRows] = useState<WidgetRow[]>([])

  useLayoutEffect(() => {
    const dashboard = dashboardRef.current

    if (!dashboard) {
      return
    }

    const widgets = Array.from(dashboard.querySelectorAll<HTMLElement>(':scope > .widget'))
    const measureRows = () => {
      const dashboardTop = dashboard.getBoundingClientRect().top

      setRows(
        getWidgetRows({
          widgets: widgets.flatMap((widget) => {
            const id = widget.dataset.slug
            const rect = widget.getBoundingClientRect()

            return id && rect.height > 0
              ? [{ id, bottom: rect.bottom - dashboardTop, top: rect.top - dashboardTop }]
              : []
          }),
        }),
      )
    }

    measureRows()
    const observer = new ResizeObserver(measureRows)

    observer.observe(dashboard)
    widgets.forEach((widget) => observer.observe(widget))
    return () => observer.disconnect()
  }, [dashboardRef, layout])

  const firstRow = rows[0]

  return (
    <div className="dashboard-row-drop-targets">
      {firstRow && (
        <RowDropTarget
          index={layout.findIndex(({ item }) => item.id === firstRow.firstWidgetID)}
          position="before"
          top={firstRow.top}
          widgetID={firstRow.firstWidgetID}
        />
      )}
      {rows.map((row, index) => (
        <RowDropTarget
          index={layout.findIndex(({ item }) => item.id === row.lastWidgetID) + 1}
          key={row.lastWidgetID}
          position="after"
          top={rows[index + 1] ? (row.bottom + rows[index + 1]!.top) / 2 : row.bottom}
          widgetID={row.lastWidgetID}
        />
      ))}
    </div>
  )
}
