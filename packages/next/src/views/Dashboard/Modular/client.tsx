'use client'

import type { Layout } from 'react-grid-layout'

import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { useCallback, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import type { RenderedWidget, RenderedWidgetLibrary } from './index.js'

import { DashboardBreadcrumbDropdown } from './DashboardBreadcrumbDropdown.js'
import { useDashboardLayout } from './useDashboardLayout.js'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINT = 768

interface ModularDashboardClientProps {
  defaultWidgets: RenderedWidget[]
  savedWidgets: RenderedWidget[]
  widgets: RenderedWidgetLibrary[] // widget library for "Add Widget" functionality
}

export function ModularDashboardClient({
  defaultWidgets,
  savedWidgets,
  widgets: _widgets, // For future "Add Widget" functionality
}: ModularDashboardClientProps) {
  const { isEditing, resetLayout, saveLayout, setIsEditing } = useDashboardLayout()

  // Determine which widgets to use (saved if available, otherwise default)
  const currentWidgets = savedWidgets.length > 0 ? savedWidgets : defaultWidgets

  // Extract layout from current widgets
  const [currentLayout, setCurrentLayout] = useState<Layout[]>(() =>
    currentWidgets.map((widget) => widget.layout),
  )

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleResetLayout = useCallback(async () => {
    await resetLayout()
    // Reload the page to get fresh default widgets from server
    window.location.reload()
  }, [resetLayout])

  const handleSaveChanges = useCallback(async () => {
    await saveLayout(currentLayout)
    setIsEditing(false)
    // Reload the page to get fresh saved widgets from server
    window.location.reload()
  }, [saveLayout, currentLayout, setIsEditing])

  const handleCancel = useCallback(() => {
    // Restore the layout from current widgets (either saved or default)
    const originalLayout = currentWidgets.map((widget) => widget.layout)
    setCurrentLayout(originalLayout)
    setIsEditing(false)
  }, [currentWidgets, setIsEditing])

  const handleAddWidget = () => {
    // TODO: Open add widget modal
  }

  // Handle layout changes during editing
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (isEditing) {
        setCurrentLayout(newLayout)
      }
    },
    [isEditing],
  )

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
        className={`grid-layout ${isEditing ? 'editing' : ''}`}
        cols={{ lg: 12, xxs: 6 }}
        isDraggable={isEditing}
        isResizable={isEditing}
        layouts={{ lg: currentLayout }}
        onLayoutChange={handleLayoutChange}
        rowHeight={(BREAKPOINT / 12) * 3}
      >
        {currentWidgets &&
          currentWidgets.map((widget, index) => (
            <div className="widget" key={`${widget.widgetSlug}-${index}`}>
              <div className="widget-content">{widget.component}</div>
            </div>
          ))}
      </ResponsiveGridLayout>
    </div>
  )
}
