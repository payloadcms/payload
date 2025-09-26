'use client'

import type { Widget } from 'payload'
import type { Layout } from 'react-grid-layout'

import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import React, { useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import { DashboardBreadcrumbDropdown } from './DashboardBreadcrumbDropdown.js'
import { useDashboardLayout } from './useDashboardLayout.js'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINT = 768

export type WidgetInstanceClient = {
  clientLayout: Layout
  component: React.ReactNode
}

export function ModularDashboardClient({
  layout: initialLayout,
  widgets, // For future "Add Widget" functionality
}: {
  layout: WidgetInstanceClient[]
  widgets: Widget[]
}) {
  // TODO: add addWidget or something like that to add widget to layout
  const {
    cancel,
    currentLayout,
    isEditing,
    resetLayout,
    saveLayout,
    setCurrentLayout,
    setIsEditing,
  } = useDashboardLayout(initialLayout, widgets)

  // Handle layout changes from react-grid-layout while preserving components
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (isEditing) {
        // Merge new layout positions with existing components
        const updatedLayout = currentLayout.map((item, index) => ({
          ...item,
          clientLayout: newLayout[index] || item.clientLayout, // Use new layout if available, fallback to current
        }))
        setCurrentLayout(updatedLayout)
      }
    },
    [isEditing, currentLayout, setCurrentLayout],
  )

  return (
    <div>
      <SetStepNav
        nav={[
          {
            label: (
              <DashboardBreadcrumbDropdown
                isEditing={isEditing}
                onAddWidget={() => {
                  /** TODO: in the future, not yet */
                }}
                onCancel={cancel}
                onEditClick={() => setIsEditing(true)}
                onResetLayout={resetLayout}
                onSaveChanges={saveLayout}
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
        layouts={{
          lg: currentLayout.map((item) => item.clientLayout),
        }}
        onLayoutChange={handleLayoutChange}
        rowHeight={(BREAKPOINT / 12) * 3}
        useCSSTransforms={false}
      >
        {currentLayout &&
          currentLayout.map((widget) => (
            <div className="widget" key={widget.clientLayout.i}>
              <div className="widget-content">{widget.component}</div>
            </div>
          ))}
      </ResponsiveGridLayout>
    </div>
  )
}
