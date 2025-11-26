'use client'

import type { Widget, WidgetWidth } from 'payload'

import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { ChevronIcon, Popup, PopupList, XIcon } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

import { DashboardStepNav } from './DashboardStepNav.js'
import { useDashboardLayout } from './useDashboardLayout.js'
import { closestInXAxis } from './utils/collisionDetection.js'
import { useDashboardSensors } from './utils/sensors.js'

export type WidgetItem = {
  i: string
  maxW: WidgetWidth
  minW: WidgetWidth
  w: WidgetWidth
}

export type WidgetInstanceClient = {
  component: React.ReactNode
  item: WidgetItem
}

export type DropTargetWidget = {
  position: 'after' | 'before'
  widget: WidgetInstanceClient
} | null

/* eslint-disable perfectionist/sort-objects */
const WIDTH_TO_PERCENTAGE = {
  'x-small': 25,
  small: (1 / 3) * 100,
  medium: 50,
  large: (2 / 3) * 100,
  'x-large': 75,
  full: 100,
} as const

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
    resizeWidget,
    saveLayout,
    setIsEditing,
  } = useDashboardLayout(initialLayout)

  const [_dropTargetWidget, setDropTargetWidget] = useState<DropTargetWidget>(null)
  const [activeDragId, setActiveDragId] = useState<null | string>(null)
  const sensors = useDashboardSensors()

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
        collisionDetection={closestInXAxis}
        onDragCancel={() => {
          setDropTargetWidget(null)
          setActiveDragId(null)
        }}
        onDragEnd={(event) => {
          const droppableId = event.over.id as string
          const i = droppableId.lastIndexOf('-')
          const slug = droppableId.slice(0, i)
          const position = droppableId.slice(i + 1)

          if (slug === event.active.id) {
            return
          }

          const moveFromIndex = currentLayout?.findIndex((w) => w.item.i === event.active.id)
          let moveToIndex = currentLayout?.findIndex((w) => w.item.i === slug)
          if (moveFromIndex < moveToIndex) {
            moveToIndex--
          }
          if (position === 'after') {
            moveToIndex++
          }
          moveWidget({ moveFromIndex, moveToIndex })
          setDropTargetWidget(null)
          setActiveDragId(null)
        }}
        onDragStart={(event) => {
          setActiveDragId(event.active.id as string)
        }}
        sensors={sensors}
      >
        <div
          className={`grid-layout ${isEditing ? 'editing' : ''}`}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            // Don't add gap here! We need to use padding on the widgets instead
            // to make sure all rows have the same width always.
          }}
        >
          {currentLayout?.map((widget, _index) => (
            <React.Fragment key={widget.item.i}>
              <DraggableItem
                disabled={!isEditing}
                id={widget.item.i}
                style={{
                  width: `${WIDTH_TO_PERCENTAGE[widget.item.w]}%`,
                  padding: '6px',
                }}
                width={widget.item.w}
              >
                <div className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}>
                  <div className="widget-content">{widget.component}</div>
                  {isEditing && (
                    <div
                      className="widget-wrapper__controls"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <WidgetWidthDropdown
                        currentWidth={widget.item.w}
                        maxW={widget.item.maxW}
                        minW={widget.item.minW}
                        onResize={(width) => resizeWidget(widget.item.i, width)}
                      />
                      <button
                        className="widget-wrapper__delete-btn"
                        onClick={() => deleteWidget(widget.item.i)}
                        title={`Delete widget ${widget.item.i}`}
                        type="button"
                      >
                        <XIcon />
                      </button>
                    </div>
                  )}
                </div>
              </DraggableItem>
            </React.Fragment>
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
            {activeDragId
              ? (() => {
                  const draggedWidget = currentLayout?.find((w) => w.item.i === activeDragId)
                  return draggedWidget ? (
                    <div
                      style={{
                        transform: 'scale(0.25)',
                      }}
                    >
                      <div
                        className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}
                      >
                        <div className="widget-content">{draggedWidget.component}</div>
                      </div>
                    </div>
                  ) : null
                })()
              : null}
          </DragOverlay>
        </div>
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

function WidgetWidthDropdown({
  currentWidth,
  maxW,
  minW,
  onResize,
}: {
  currentWidth: WidgetWidth
  maxW: WidgetWidth
  minW: WidgetWidth
  onResize: (width: WidgetWidth) => void
}) {
  // Filter options based on minW and maxW
  const validOptions = useMemo(() => {
    const minPercentage = WIDTH_TO_PERCENTAGE[minW]
    const maxPercentage = WIDTH_TO_PERCENTAGE[maxW]

    return Object.entries(WIDTH_TO_PERCENTAGE)
      .map(([key, value]) => ({
        width: key as WidgetWidth,
        percentage: value,
      }))
      .filter((option) => option.percentage >= minPercentage && option.percentage <= maxPercentage)
  }, [minW, maxW])

  const isDisabled = validOptions.length <= 1

  return (
    <Popup
      button={
        <button
          className="widget-wrapper__size-btn"
          disabled={isDisabled}
          onPointerDown={(e) => e.stopPropagation()}
          type="button"
        >
          <span className="widget-wrapper__size-btn-text">{currentWidth}</span>
          <ChevronIcon className="widget-wrapper__size-btn-icon" />
        </button>
      }
      buttonType="custom"
      disabled={isDisabled}
      render={({ close }) => (
        <PopupList.ButtonGroup>
          {validOptions.map((option) => {
            const isSelected = option.width === currentWidth
            return (
              <PopupList.Button
                active={isSelected}
                key={option.width}
                onClick={() => {
                  onResize(option.width)
                  close()
                }}
              >
                <span className="widget-wrapper__size-btn-label">{option.width}</span>
                <span className="widget-wrapper__size-btn-percentage">
                  {option.percentage.toFixed(0)}%
                </span>
              </PopupList.Button>
            )
          })}
        </PopupList.ButtonGroup>
      )}
      size="small"
      verticalAlign="bottom"
    />
  )
}

function DraggableItem(props: {
  children: React.ReactNode
  disabled?: boolean
  id: string
  style?: React.CSSProperties
  width: WidgetWidth
}) {
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: props.id,
    disabled: props.disabled,
  })

  const mergedStyles: React.CSSProperties = {
    ...props.style,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
  }

  return (
    <div className="widget" data-slug={props.id} data-width={props.width} style={mergedStyles}>
      <DroppableItem id={props.id} position="before" />
      <div
        id={props.id}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {props.children}
      </div>
      <DroppableItem id={props.id} position="after" />
    </div>
  )
}

function DroppableItem({ id, position }: { id: string; position: 'after' | 'before' }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${id}-${position}`, data: { position } })

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: position === 'before' ? -2 : 'auto',
        right: position === 'after' ? -2 : 'auto',
        top: 0,
        bottom: 0,
        borderRadius: '1000px',
        width: '4px',
        backgroundColor: isOver ? 'var(--theme-success-400)' : 'transparent',
        marginBottom: '10px',
        marginTop: '10px',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  )
}
