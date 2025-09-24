'use client'

import { type ReactNode } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

interface RenderedWidget {
  component: ReactNode
  height: '1' | '2'
  id: string
  width: '1' | '1/2' | '1/3' | '1/4' | '2/3' | '3/4'
}

interface ModularDashboardClientProps {
  widgets: RenderedWidget[]
}

const ResponsiveGridLayout = WidthProvider(Responsive)

const WIDTH_TO_COLS_MAP = {
  '1': 12,
  '1/2': 6,
  '1/3': 4,
  '1/4': 3,
  '2/3': 8,
  '3/4': 9,
}

const HEIGHT_TO_ROWS_MAP = {
  '1': 3,
  '2': 6,
}

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
      currentX += WIDTH_TO_COLS_MAP[prevWidget.width]

      // If we exceed the row width, wrap to next row
      if (currentX > colsPerRow) {
        currentY += widgets
          .slice(0, i)
          .reduce((maxH, w) => Math.max(maxH, HEIGHT_TO_ROWS_MAP[w.height]), 0)
        currentX = WIDTH_TO_COLS_MAP[prevWidget.width]
      }
    }

    x = currentX
    y = currentY

    return {
      h: HEIGHT_TO_ROWS_MAP[widget.height],
      i: widget.id,
      maxH: 6,
      maxW: 12,
      minH: 1,
      minW: 1,
      w: WIDTH_TO_COLS_MAP[widget.width],
      x,
      y: 0,
    }
  })

  console.log('layout', layout)

  return (
    <ResponsiveGridLayout
      // 640 or 768?
      breakpoints={{ lg: 768, xxs: 0 }}
      className="grid-layout"
      cols={{ lg: 12, xxs: 6 }}
      compactType={null}
      isDraggable
      isResizable
      layouts={{ lg: layout }}
      onDrag={(currLayout, oldItem, layoutItem, placeholder) => {
        // Optional: lock height while dragging to avoid illegal sizes
        const h = layoutItem.h <= 3 ? 3 : 6
        layoutItem.h = h
        if (placeholder) {
          placeholder.h = h
        }
      }}
      onResize={(currLayout, oldItem, layoutItem, placeholder) => {
        const allowedW = [12, 9, 8, 6, 4, 3]
        const allowedH = [3, 6]

        const snap = (val: number, allowed: number[]) =>
          allowed.reduce((p, c) => (Math.abs(c - val) < Math.abs(p - val) ? c : p))

        const w = snap(layoutItem.w, allowedW)
        const h = snap(layoutItem.h, allowedH)

        // snap live while resizing
        layoutItem.w = w
        layoutItem.h = h
        if (placeholder) {
          placeholder.w = w
          placeholder.h = h
        }
      }}
      preventCollision
      rowHeight={64}
    >
      {widgets.map((widget) => (
        <div className="widget" key={widget.id}>
          {widget.component}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
