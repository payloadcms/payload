'use client'

import type { Widget } from 'payload'
import type { Layout } from 'react-grid-layout'

import { ItemsDrawer, XIcon } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui/elements/Button'
import { DrawerToggler } from '@payloadcms/ui/elements/Drawer'
import { type Option, ReactSelect } from '@payloadcms/ui/elements/ReactSelect'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import React, { useId } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import { useDashboardLayout } from './useDashboardLayout.js'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINT = 768

export type WidgetInstanceClient = {
  clientLayout: Layout
  component: React.ReactNode
}

export function ModularDashboardClient({
  clientLayout: initialLayout,
  widgets,
}: {
  clientLayout: WidgetInstanceClient[]
  widgets: Widget[]
}) {
  const { addWidget, currentLayout, deleteWidget, handleLayoutChange, isEditing } =
    useDashboardLayout(initialLayout)

  const uuid = useId()
  const drawerSlug = `widgets-drawer-${uuid}`

  return (
    <div>
      <SetStepNav
        nav={[
          {
            label: (
              <DashboardBreadcrumbDropdown clientLayout={initialLayout} drawerSlug={drawerSlug} />
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
              <div className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}>
                <div className="widget-content">{widget.component}</div>
                {isEditing && (
                  <button
                    className="widget-wrapper__delete-btn"
                    onClick={() => deleteWidget(widget.clientLayout.i)}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={`Delete widget ${widget.clientLayout.i}`}
                    type="button"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
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

export function DashboardBreadcrumbDropdown(props: {
  clientLayout: WidgetInstanceClient[]
  drawerSlug: string
}) {
  const { cancel, isEditing, resetLayout, saveLayout, setIsEditing } = useDashboardLayout(
    props.clientLayout,
  )

  if (isEditing) {
    return (
      <div className="dashboard-breadcrumb-dropdown__editing">
        <span>Editing Dashboard</span>
        <div className="dashboard-breadcrumb-dropdown__actions">
          <DrawerToggler className="drawer-toggler--unstyled" slug={props.drawerSlug}>
            <Button buttonStyle="pill" el="span" size="small">
              Add +
            </Button>
          </DrawerToggler>
          <Button buttonStyle="pill" onClick={saveLayout} size="small">
            Save Changes
          </Button>
          <Button buttonStyle="pill" onClick={cancel} size="small">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const options = [
    { label: 'Edit Dashboard', value: 'edit' },
    { label: 'Reset Layout', value: 'reset' },
  ]

  const handleChange = (selectedOption: Option | Option[]) => {
    // Since isMulti is false, we expect a single Option
    const option = Array.isArray(selectedOption) ? selectedOption[0] : selectedOption

    if (option?.value === 'edit') {
      setIsEditing(true)
    } else if (option?.value === 'reset') {
      void resetLayout()
    }
  }

  return (
    <ReactSelect
      className="dashboard-breadcrumb-select"
      isClearable={false}
      isSearchable={false}
      menuIsOpen={undefined} // Let ReactSelect handle open/close
      onChange={handleChange}
      options={options}
      placeholder="Dashboard"
      value={{ label: 'Dashboard', value: 'dashboard' }}
    />
  )
}
