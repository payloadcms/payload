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

const BREAKPOINT = 640 //768

export type WidgetInstanceClient = {
  clientLayout: Layout
  component: React.ReactNode
}

export function GridLayoutDashboardClient({
  clientLayout: initialLayout,
  widgets,
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
  } = useDashboardLayout(initialLayout)

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
        cols={{ lg: 12, xxs: 3 }} // xxs: 6?
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
            <div
              className="widget"
              data-columns={widget.clientLayout.w}
              data-rows={widget.clientLayout.h}
              data-slug={widget.clientLayout.i}
              key={widget.clientLayout.i}
            >
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
  isEditing: boolean
  onCancel: () => void
  onEditClick: () => void
  onResetLayout: () => void
  onSaveChanges: () => void
  widgetsDrawerSlug: string
}) {
  const { isEditing, onCancel, onEditClick, onResetLayout, onSaveChanges, widgetsDrawerSlug } =
    props
  if (isEditing) {
    return (
      <div className="dashboard-breadcrumb-dropdown__editing">
        <span>Editing Dashboard</span>
        <div className="dashboard-breadcrumb-dropdown__actions">
          <DrawerToggler className="drawer-toggler--unstyled" slug={widgetsDrawerSlug}>
            <Button buttonStyle="pill" el="span" size="small">
              Add +
            </Button>
          </DrawerToggler>
          <Button buttonStyle="pill" onClick={onSaveChanges} size="small">
            Save Changes
          </Button>
          <Button buttonStyle="pill" onClick={onCancel} size="small">
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
      onEditClick()
    } else if (option?.value === 'reset') {
      onResetLayout()
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
