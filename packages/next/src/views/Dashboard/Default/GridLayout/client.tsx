'use client'

import type { Widget } from 'payload'

import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { XIcon } from '@payloadcms/ui'
import React, { useState } from 'react'

import { DashboardStepNav } from './DashboardStepNav.js'
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

type DropTargetWidget = {
  position: 'after' | 'before'
  widget: WidgetInstanceClient
} | null

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
    moveWidget,
    resetLayout,
    saveLayout,
    setIsEditing,
  } = useDashboardLayout(initialLayout)

  const [dropTargetWidget, setDropTargetWidget] = useState<DropTargetWidget>(null)
  const { setNodeRef } = useDroppable({ id: 'droppable' })

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
        id="sortable"
        onDragEnd={(event) => {
          moveWidget({
            moveFromIndex: currentLayout?.findIndex((w) => w.item.i === event.active.id),
            moveToIndex: currentLayout?.findIndex((w) => w.item.i === event.over?.id),
          })
          setDropTargetWidget(null)
        }}
        onDragStart={(event) => {
          setDropTargetWidget({
            position: 'after',
            widget: currentLayout?.find((w) => w.item.i === event.active.id),
          })
        }}
      >
        <SortableContext items={currentLayout?.map((w) => w.item.i)}>
          <div
            className={`grid-layout ${isEditing ? 'editing' : ''}`}
            ref={setNodeRef}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            {currentLayout?.map((widget) => (
              <SortableItem
                className="widget"
                data-columns={widget.item.w}
                data-slug={widget.item.i}
                disabled={!isEditing}
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
              </SortableItem>
            ))}
            <DragOverlay
              className="drag-overlay"
              dropAnimation={{
                duration: 100,
              }}
              modifiers={[snapCenterToCursor]}
            >
              {dropTargetWidget ? (
                <div
                  style={{
                    transform: 'scale(0.25)',
                  }}
                >
                  <div className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}>
                    <div className="widget-content">{dropTargetWidget.widget.component}</div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </div>
        </SortableContext>
      </DndContext>
      <DashboardStepNav
        addWidget={addWidget}
        cancel={cancel}
        isEditing={isEditing}
        resetLayout={resetLayout}
        saveLayout={saveLayout}
        setIsEditing={setIsEditing}
        widgets={widgets}
      />
    </div>
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
  const { attributes, isDragging, isOver, listeners, setNodeRef } = useSortable({
    id: props.id,
    disabled: props.disabled,
  })

  const mergedStyles = {
    ...props.style,
    borderRight: isOver ? '2px solid #3B82F6' : 'none',
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
