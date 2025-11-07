'use client'

import type { Widget, WidgetWidth } from 'payload'

import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { ChevronIcon, Popup, PopupList, XIcon } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

import { DashboardStepNav } from './DashboardStepNav.js'
import { useDashboardLayout } from './useDashboardLayout.js'
import { customCollision } from './utils/collisionDetection.js'
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

  const [dropTargetWidget, setDropTargetWidget] = useState<DropTargetWidget>(null)
  const { setNodeRef } = useDroppable({ id: 'droppable' })
  const sensors = useDashboardSensors()

  // Create custom collision detection that considers left/right halves
  // Note: setDropTargetWidget is stable, so we don't need it in dependencies
  const collisionDetection = useMemo(
    () => customCollision(currentLayout, setDropTargetWidget),
    [currentLayout, setDropTargetWidget],
  )

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
        collisionDetection={collisionDetection}
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
        sensors={sensors}
      >
        <SortableContext items={currentLayout?.map((w) => w.item.i)}>
          <div
            className={`grid-layout ${isEditing ? 'editing' : ''}`}
            ref={setNodeRef}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {currentLayout?.map((widget, index) => (
              <React.Fragment key={widget.item.i}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-2px',
                    top: 0,
                    bottom: 0,
                    width: '0px',
                    outline: '2px solid blue',
                    pointerEvents: 'none',
                    zIndex: 1000,
                  }}
                />
                <SortableItem
                  disabled={!isEditing}
                  id={widget.item.i}
                  style={{
                    width: `${WIDTH_TO_PERCENTAGE[widget.item.w]}%`,
                    padding: '6px',
                  }}
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
                </SortableItem>
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
                <span className="widget-wrapper__size-btn-percentage">{option.percentage}%</span>
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

function SortableItem(props: {
  children: React.ReactNode
  disabled?: boolean
  id: string
  style?: React.CSSProperties
}) {
  const { attributes, isDragging, listeners, setNodeRef } = useSortable({
    id: props.id,
    disabled: props.disabled,
  })

  const mergedStyles: React.CSSProperties = {
    ...props.style,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
  }

  return (
    <div
      id={props.id}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="widget"
      style={mergedStyles}
    >
      {props.children}
    </div>
  )
}
