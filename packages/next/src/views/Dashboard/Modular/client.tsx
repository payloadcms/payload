'use client'

import type { Widget } from 'payload'
import type { Layout } from 'react-grid-layout'

import { ItemsDrawer } from '@payloadcms/ui'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import React, { useId } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import { DashboardBreadcrumbDropdown } from './DashboardBreadcrumbDropdown.js'
import { useDashboardLayout } from './useDashboardLayout.js'
import { WidgetWrapper } from './WidgetWrapper.js'

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
  const {
    addWidget,
    cancel,
    currentLayout,
    deleteWidget,
    handleLayoutChange,
    isEditing,
    resetLayout,
    saveLayout,
    setIsEditing,
  } = useDashboardLayout(initialLayout, widgets)

  const uuid = useId()
  const drawerSlug = `widgets-drawer-${uuid}`

  return (
    <div>
      <SetStepNav
        nav={[
          {
            label: (
              <DashboardBreadcrumbDropdown
                isEditing={isEditing}
                onCancel={cancel}
                onEditClick={() => setIsEditing(true)}
                onResetLayout={resetLayout}
                onSaveChanges={saveLayout}
                widgetsDrawerSlug={drawerSlug}
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
              <WidgetWrapper
                isEditing={isEditing}
                onDelete={() => deleteWidget(widget.clientLayout.i)}
                widgetId={widget.clientLayout.i}
              >
                <div className="widget-content">{widget.component}</div>
              </WidgetWrapper>
            </div>
          ))}
      </ResponsiveGridLayout>
      {isEditing && (
        <ItemsDrawer
          drawerSlug={drawerSlug}
          items={widgets}
          onItemClick={(widget) => addWidget(widget.slug)}
          searchPlaceholder="Search widgets..."
          title="Add Widget"
        />
      )}
    </div>
  )
}
