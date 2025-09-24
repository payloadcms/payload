'use client'

import type { DefaultDashboardWidget } from 'payload'

import { type ReactNode } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

interface ModularDashboardClientProps {
  widgets: Array<{ component: ReactNode; id: string } & DefaultDashboardWidget>
}

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINT = 768

export function ModularDashboardClient({ widgets }: ModularDashboardClientProps) {
  console.log('widgets', widgets)
  // Generate layout based on widget width and height
  const layout = widgets.map((widget, index) => {
    const colsPerRow = 12
    let x = 0
    let y = 0

    // Simple layout algorithm: place widgets left to right, then wrap to next row
    let currentX = 0
    let currentY = 0

    for (let i = 0; i < index; i++) {
      const prevWidget = widgets[i]
      currentX += prevWidget.width

      // If we exceed the row width, wrap to next row
      if (currentX > colsPerRow) {
        currentY += widgets.slice(0, i).reduce((maxH, w) => Math.max(maxH, w.height), 0)
        currentX = prevWidget.width
      }
    }

    x = currentX
    y = currentY

    return {
      h: widget.height,
      i: widget.id,
      maxH: 3,
      maxW: 12,
      minH: 1,
      minW: 3,
      w: widget.width,
      x,
      y: 0,
    }
  })

  console.log('layout', layout)

  return (
    <ResponsiveGridLayout
      breakpoints={{ lg: BREAKPOINT, xxs: 0 }}
      className="grid-layout"
      cols={{ lg: 12, xxs: 6 }}
      compactType={null}
      isDraggable
      isResizable
      layouts={{ lg: layout }}
      rowHeight={(BREAKPOINT / 12) * 3}
    >
      {widgets.map((widget) => (
        <div className="widget" key={widget.id}>
          {widget.component}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
