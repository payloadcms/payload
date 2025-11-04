'use client'

import type { Widget } from 'payload'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useSortable } from '@dnd-kit/sortable'
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
    handleDragOver,
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
        onDragEnd={(ev) => {
          console.log('over.id', ev.over?.id)
          setActiveId(null)
        }}
        onDragOver={handleDragOver}
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

function SortableFlex(props: {
  activeId: null | string
  className?: string
  currentLayout: undefined | WidgetInstanceClient[]
  isEditing: boolean
  onDragEnd: (event: DragEndEvent) => void
  onDragOver: ({
    moveFromIndex,
    moveToIndex,
  }: {
    moveFromIndex: number
    moveToIndex: number
  }) => void
  onDragStart: (event: DragStartEvent) => void
  renderItem: (widget: WidgetInstanceClient) => React.ReactNode
}) {
  const { setNodeRef } = useDroppable({
    id: 'droppable',
  })
  const [activeWidth, setActiveWidth] = useState<null | number>(null)
  const activeWidget = props.activeId
    ? props.currentLayout?.find((w) => w.item.i === props.activeId)
    : null

  const handleDragStart = (event: DragStartEvent) => {
    // Only allow drag when editing
    if (!props.isEditing) {
      return
    }
    // Get the actual width of the dragged element
    const element = document.querySelector(`[id="${event.active.id}"]`)
    if (element instanceof HTMLElement) {
      setActiveWidth(element.offsetWidth)
    }
    props.onDragStart(event)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveWidth(null)
    props.onDragEnd(event)
  }

  return (
    <DndContext
      autoScroll={{
        enabled: true,
        threshold: {
          x: 0, // No horizontal scroll
          y: 0.2, // Allow vertical scroll at 20% from edge
        },
      }}
      collisionDetection={closestCenter}
      id="sortable"
      onDragEnd={handleDragEnd}
      onDragMove={(ev) => {
        props.onDragOver({
          moveFromIndex: props.currentLayout?.findIndex((w) => w.item.i === ev.active.id),
          moveToIndex: props.currentLayout?.findIndex((w) => w.item.i === ev.over?.id),
        })
      }}
      onDragStart={handleDragStart}
    >
      <div
        className={props.className}
        ref={setNodeRef}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {props.currentLayout?.map((widget) => (
          <SortableItem
            className="widget"
            data-columns={widget.item.w}
            data-slug={widget.item.i}
            disabled={!props.isEditing}
            id={widget.item.i}
            key={widget.item.i}
            style={{
              width: `calc(${(widget.item.w / 12) * 100}% - 1rem)`,
            }}
          >
            {props.renderItem(widget)}
          </SortableItem>
        ))}
        <DragOverlay
          className="drag-overlay"
          dropAnimation={{
            duration: 100,
          }}
          modifiers={[snapCenterToCursor]}
          style={{
            width: activeWidth ? `${activeWidth}px` : undefined,
          }}
        >
          {activeWidget ? (
            <div
              style={{
                transform: 'scale(0.25)',
              }}
            >
              <div className={`widget-wrapper ${props.isEditing ? 'widget-wrapper--editing' : ''}`}>
                <div className="widget-content">{activeWidget.component}</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

function SortableItem(props: {
  children: React.ReactNode
  className?: string
  'data-columns'?: number
  'data-slug'?: string
  disabled?: boolean
  id: string
  style?: React.CSSProperties
}) {
  const { attributes, isDragging, listeners, setNodeRef } = useSortable({
    id: props.id,
    disabled: props.disabled,
  })

  const mergedStyles = {
    ...props.style,
    opacity: isDragging ? 0.3 : 1,
  }

  // Only apply drag listeners when not disabled
  const dragProps = props.disabled ? {} : { ...listeners, ...attributes }

  return (
    <div ref={setNodeRef} {...dragProps} {...props} style={mergedStyles}>
      {props.children}
    </div>
  )
}
