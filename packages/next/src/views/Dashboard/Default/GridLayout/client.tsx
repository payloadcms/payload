'use client'

import type { Widget } from 'payload'

import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core'
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
        // `pointerWithin` is the collision detector made precisely for
        // cases like ours, where dragOverlay has a scale(0.25) and we use
        // snapCenterToCursor. The documentation recommends using it with
        // `rectIntersection` as a fallback for a11y reasons. See:
        // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#composition-of-existing-algorithms
        collisionDetection={(args) => {
          // First, let's see if there are any collisions with the pointer
          const pointerCollisions = pointerWithin(args)

          // Collision detection algorithms return an array of collisions
          if (pointerCollisions.length > 0) {
            return pointerCollisions
          }

          // If there are no collisions with the pointer, return rectangle intersections
          return rectIntersection(args)
        }}
        id="sortable"
        onDragEnd={(event) => {
          const moveFromIndex = currentLayout?.findIndex((w) => w.item.i === event.active.id)
          let moveToIndex = currentLayout?.findIndex((w) => w.item.i === event.over?.id)
          if (moveFromIndex < moveToIndex) {
            moveToIndex--
          }
          moveWidget({ moveFromIndex, moveToIndex })
          setDropTargetWidget(null)
        }}
        onDragOver={(event) => {
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
                dropTargetWidget={
                  dropTargetWidget?.widget.item.i === widget.item.i ? dropTargetWidget : null
                }
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
                      onPointerDown={(e) => e.stopPropagation()}
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
              // Needed for the scale(0.25) of the dragOverlay, so there is no offset
              // between the dragOverlay and the mouse pointer.
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
  dropTargetWidget?: DropTargetWidget
  id: string
  style?: React.CSSProperties
}) {
  const { attributes, isDragging, isOver, listeners, setNodeRef } = useSortable({
    id: props.id,
    disabled: props.disabled,
  })

  const mergedStyles = {
    ...props.style,
    boxShadow: isOver ? '-2px 0 0 0 #3B82F6' : 'none',
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} {...props} style={mergedStyles}>
      {props.children}
    </div>
  )
}
