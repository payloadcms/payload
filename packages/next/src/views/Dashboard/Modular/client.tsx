'use client'

import type { Widget } from 'payload'
import type { Layout } from 'react-grid-layout'

import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import React from 'react'
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
  clientLayout: initialLayout,
  widgets, // For future "Add Widget" functionality
}: {
  clientLayout: WidgetInstanceClient[]
  widgets: Widget[]
}) {
  // TODO: add addWidget or something like that to add widget to layout
  const {
    cancel,
    currentLayout,
    handleLayoutChange,
    isEditing,
    resetLayout,
    saveLayout,
    setIsEditing,
  } = useDashboardLayout(initialLayout, widgets)

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
