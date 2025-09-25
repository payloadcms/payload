'use client'

import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import type { RenderedWidget } from './index.js'

import { DashboardBreadcrumbDropdown } from './DashboardBreadcrumbDropdown.js'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINT = 768

export function ModularDashboardClient({ widgets }: { widgets: RenderedWidget[] }) {
  const [isEditing, setIsEditing] = useState(false)

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleResetLayout = () => {
    // TODO: Reset layout to default
  }

  const handleSaveChanges = () => {
    // TODO: Save layout changes
    setIsEditing(false)
  }

  const handleCancel = () => {
    // TODO: Revert layout changes
    setIsEditing(false)
  }

  const handleAddWidget = () => {
    // TODO: Open add widget modal
  }

  // Generate layout based on widget width and height
  const layout = widgets.map((widget, index) => {
    const colsPerRow = 12
    let x = 0

    // Simple layout algorithm: place widgets left to right, then wrap to next row
    let currentX = 0

    for (let i = 0; i < index; i++) {
      const prevWidget = widgets[i]
      currentX += prevWidget.width

      // If we exceed the row width, wrap to next row
      if (currentX > colsPerRow) {
        currentX = prevWidget.width
      }
    }

    x = currentX

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

  return (
    <div>
      <SetStepNav
        nav={[
          {
            label: (
              <DashboardBreadcrumbDropdown
                isEditing={isEditing}
                onAddWidget={handleAddWidget}
                onCancel={handleCancel}
                onEditClick={handleEditClick}
                onResetLayout={handleResetLayout}
                onSaveChanges={handleSaveChanges}
              />
            ),
          },
        ]}
      />

      <ResponsiveGridLayout
        breakpoints={{ lg: BREAKPOINT, xxs: 0 }}
        className="grid-layout"
        cols={{ lg: 12, xxs: 6 }}
        compactType={null}
        isDraggable={isEditing}
        isResizable={isEditing}
        layouts={{ lg: layout }}
        preventCollision // not sure if this gives a better UX
        rowHeight={(BREAKPOINT / 12) * 3}
      >
        {widgets.map((widget) => (
          <div className="widget" key={widget.id}>
            <div className="widget-content">{widget.component}</div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}
