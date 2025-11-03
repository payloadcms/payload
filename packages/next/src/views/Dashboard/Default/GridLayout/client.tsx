'use client'

import type { DragStartEvent } from '@dnd-kit/core'
import type { Widget } from 'payload'

import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { ItemsDrawer, XIcon } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui/elements/Button'
import { DrawerToggler } from '@payloadcms/ui/elements/Drawer'
import { type Option, ReactSelect } from '@payloadcms/ui/elements/ReactSelect'
import { useStepNav } from '@payloadcms/ui/elements/StepNav'
import React, { useEffect, useId, useState } from 'react'

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
  const [activeId, setActiveId] = useState<null | string>(null)

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
      <SortableFlex
        activeId={activeId}
        className={`grid-layout ${isEditing ? 'editing' : ''}`}
        currentLayout={currentLayout}
        isEditing={isEditing}
        onDragEnd={() => setActiveId(null)}
        onDragStart={(event) => setActiveId(String(event.active.id))}
        renderItem={(widget) => (
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
        )}
      />
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

function SortableFlex({
  activeId,
  className,
  currentLayout,
  isEditing,
  onDragEnd,
  onDragStart,
  renderItem,
}: {
  activeId: null | string
  className?: string
  currentLayout: undefined | WidgetInstanceClient[]
  isEditing: boolean
  onDragEnd: () => void
  onDragStart: (event: DragStartEvent) => void
  renderItem: (widget: WidgetInstanceClient) => React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id: 'droppable' })
  const [activeWidth, setActiveWidth] = useState<null | number>(null)
  const activeWidget = activeId ? currentLayout?.find((w) => w.item.i === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    const element = document.querySelector(`[id="${event.active.id}"]`)
    if (element instanceof HTMLElement) {
      setActiveWidth(element.offsetWidth)
    }
    onDragStart(event)
  }

  const handleDragEnd = () => {
    setActiveWidth(null)
    onDragEnd()
  }

  return (
    <DndContext
      autoScroll={{
        enabled: true,
        threshold: { x: 0, y: 0.2 },
      }}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div
        className={className}
        ref={setNodeRef}
        style={{
          color: isOver ? 'green' : undefined,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {currentLayout?.map((widget) => (
          <SortableItem
            key={widget.item.i}
            className="widget"
            data-columns={widget.item.w}
            data-slug={widget.item.i}
            id={widget.item.i}
            style={{
              width: `calc(${(widget.item.w / GRID_COLUMNS) * 100}% - 1rem)`,
            }}
          >
            {renderItem(widget)}
          </SortableItem>
        ))}
        <DragOverlay style={{ width: activeWidth ? `${activeWidth}px` : undefined }}>
          {activeWidget && (
            <WidgetItem
              component={activeWidget.component}
              isEditing={isEditing}
              onDelete={() => {}}
              widgetId={activeWidget.item.i}
            />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

function SortableItem({
  children,
  id,
  ...props
}: {
  children: React.ReactNode
  className?: string
  'data-columns'?: number
  'data-slug'?: string
  id: string
  style?: React.CSSProperties
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} {...props}>
      {children}
    </div>
  )
}
