'use client'

import type { Widget } from 'payload'

import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { ItemsDrawer, XIcon } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui/elements/Button'
import { DrawerToggler } from '@payloadcms/ui/elements/Drawer'
import { type Option, ReactSelect } from '@payloadcms/ui/elements/ReactSelect'
import { useStepNav } from '@payloadcms/ui/elements/StepNav'
import React, { useEffect, useId } from 'react'

import { useDashboardLayout } from './useDashboardLayout.js'

export type WidgetItem = {
  i: string
  maxW: number
  minW: number
  resizeHandles: string[]
  w: number
  x: number
  y: number
}

export type WidgetInstanceClient = {
  component: React.ReactNode
  item: WidgetItem
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
    isEditing,
    resetLayout,
    saveLayout,
    setIsEditing,
  } = useDashboardLayout(initialLayout)

  const uuid = useId()
  const drawerSlug = `widgets-drawer-${uuid}`
  const { setStepNav } = useStepNav()

  // Set step nav directly with minimal dependencies to avoid infinite loops
  useEffect(() => {
    setStepNav([
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
    ])
    // TODO: useEffectEvent
    // Only depend on isEditing and drawerSlug - the functions are stable enough
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, drawerSlug])

  return (
    <div>
      <DndContext
        autoScroll={{
          enabled: true,
          threshold: {
            x: 0, // No horizontal scroll
            y: 0.2, // Allow vertical scroll at 20% from edge
          },
        }}
      >
        <Droppable
          className={`grid-layout ${isEditing ? 'editing' : ''}`}
          onDragOver={(_ev) => {
            // STEP 1: get the center of all widgets
            const widgets = document.querySelectorAll('.widget')
            const widgetCenters = Array.from(widgets).map((widget) => {
              const rect = widget.getBoundingClientRect()
              return {
                x: rect.left + rect.width / 2 + window.scrollX,
                y: rect.top + rect.height / 2 + window.scrollY,
              }
            })

            // STEP 2: render a red dot in the center of each widget
            widgetCenters.forEach((center) => {
              const dot = document.createElement('div')
              dot.className = 'widget-center'
              dot.style.position = 'absolute'
              dot.style.left = `${center.x}px`
              dot.style.top = `${center.y}px`
              dot.style.width = '10px'
              dot.style.height = '10px'
              dot.style.backgroundColor = 'red'
              dot.style.borderRadius = '50%'
              document.body.appendChild(dot)
            })
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            {currentLayout &&
              currentLayout.map((widget) => (
                <Draggable
                  className="widget"
                  data-columns={widget.item.w}
                  data-slug={widget.item.i}
                  id={widget.item.i}
                  key={widget.item.i}
                  style={{
                    width: `calc(${(widget.item.w / 12) * 100}% - 1rem)`,
                  }}
                >
                  <div className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}>
                    <div className="widget-content">{widget.component}</div>
                    {isEditing && (
                      <button
                        className="widget-wrapper__delete-btn"
                        onClick={() => deleteWidget(widget.item.i)}
                        onMouseDown={(e) => e.stopPropagation()}
                        title={`Delete widget ${widget.item.i}`}
                        type="button"
                      >
                        <XIcon />
                      </button>
                    )}
                  </div>
                </Draggable>
              ))}
          </div>
        </Droppable>
      </DndContext>
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

function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable',
  })
  const style = {
    color: isOver ? 'green' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  )
}

interface DraggableProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
}

function Draggable(props: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  })
  const style = {
    ...props.style,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} {...props} style={style}>
      {props.children}
    </div>
  )
}
