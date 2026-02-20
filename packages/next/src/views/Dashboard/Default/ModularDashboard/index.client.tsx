'use client'

import type { Modifier } from '@dnd-kit/core'
import type { ClientWidget, WidgetWidth } from 'payload'

import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { ChevronIcon, Popup, PopupList, useTranslation, XIcon } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

/**
 * Custom modifier that only applies snapCenterToCursor for pointer events.
 * During keyboard navigation, we handle positioning ourselves via the coordinate getter.
 */
const snapCenterToCursorOnlyForPointer: Modifier = (args) => {
  const { activatorEvent } = args

  // Only apply snap for pointer events (mouse/touch), not keyboard
  // Check activatorEvent.type since KeyboardEvent may not exist on server
  if (activatorEvent && 'key' in activatorEvent) {
    return args.transform
  }

  return snapCenterToCursor(args)
}

import { DashboardStepNav } from './DashboardStepNav.js'
import { useDashboardLayout } from './useDashboardLayout.js'
import { closestInXAxis } from './utils/collisionDetection.js'
import { useDashboardSensors } from './utils/sensors.js'
import { WidgetEditControl } from './WidgetEditControl.js'

export type WidgetItem = {
  data?: Record<string, unknown>
  id: string
  maxWidth: WidgetWidth
  minWidth: WidgetWidth
  width: WidgetWidth
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

export function ModularDashboardClient({
  clientLayout: initialLayout,
  widgets,
}: {
  clientLayout: WidgetInstanceClient[]
  widgets: ClientWidget[]
}) {
  const { t } = useTranslation()
  const {
    addWidget,
    cancel,
    cancelModal,
    currentLayout,
    deleteWidget,
    isEditing,
    moveWidget,
    resetLayout,
    resizeWidget,
    saveLayout,
    setIsEditing,
    updateWidgetData,
  } = useDashboardLayout(initialLayout)

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
        // https://github.com/clauderic/dnd-kit/issues/926#issuecomment-1640115665
        id="dashboard-dnd-context"
        onDragCancel={() => {
          setActiveDragId(null)
        }}
        onDragEnd={(event) => {
          if (!event.over) {
            setActiveDragId(null)
            return
          }
          const droppableId = event.over.id as string
          const i = droppableId.lastIndexOf('-')
          const slug = droppableId.slice(0, i)
          const position = droppableId.slice(i + 1)

          if (slug === event.active.id) {
            return
          }

          const moveFromIndex = currentLayout?.findIndex(
            (widget) => widget.item.id === event.active.id,
          )
          let moveToIndex = currentLayout?.findIndex((widget) => widget.item.id === slug)
          if (moveFromIndex < moveToIndex) {
            moveToIndex--
          }
          if (position === 'after') {
            moveToIndex++
          }
          moveWidget({ moveFromIndex, moveToIndex })
          setActiveDragId(null)
        }}
        onDragStart={(event) => {
          setActiveDragId(event.active.id as string)
        }}
        sensors={sensors}
      >
        <div
          className={`modular-dashboard ${isEditing ? 'editing' : ''}`}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            // Don't add gap here! We need to use padding on the widgets instead
            // to make sure all rows have the same width always.
          }}
        >
          {currentLayout?.length === 0 && (
            <div className="modular-dashboard__empty">
              <p>
                There are no widgets on your dashboard. You can add them from the "Dashboard" menu
                located in the top bar.
              </p>
            </div>
          )}
          {currentLayout?.map((widget, _index) => (
            <React.Fragment key={widget.item.id}>
              <DraggableItem
                disabled={!isEditing}
                id={widget.item.id}
                style={{
                  width: `${WIDTH_TO_PERCENTAGE[widget.item.width]}%`,
                  padding: '6px',
                }}
                width={widget.item.width}
              >
                <div className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}>
                  <div aria-hidden={isEditing} className="widget-content" inert={isEditing}>
                    {widget.component}
                  </div>
                  {isEditing && (
                    <div
                      className="widget-wrapper__controls"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <WidgetEditControl
                        onSave={(data) => {
                          updateWidgetData(widget.item.id, data)
                        }}
                        widgetData={widget.item.data}
                        widgetID={widget.item.id}
                      />
                      <WidgetWidthDropdown
                        currentWidth={widget.item.width}
                        maxWidth={widget.item.maxWidth}
                        minWidth={widget.item.minWidth}
                        onResize={(width) => resizeWidget(widget.item.id, width)}
                      />
                      <button
                        className="widget-wrapper__delete-btn"
                        onClick={() => deleteWidget(widget.item.id)}
                        type="button"
                      >
                        <span className="sr-only">
                          {t('dashboard:deleteWidget', { id: widget.item.id })}
                        </span>
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
            // Uses custom modifier that only applies for pointer, not keyboard navigation.
            modifiers={[snapCenterToCursorOnlyForPointer]}
          >
            {activeDragId
              ? (() => {
                  const draggedWidget = currentLayout?.find(
                    (widget) => widget.item.id === activeDragId,
                  )
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
      {cancelModal}
    </div>
  )
}

function WidgetWidthDropdown({
  currentWidth,
  maxWidth,
  minWidth,
  onResize,
}: {
  currentWidth: WidgetWidth
  maxWidth: WidgetWidth
  minWidth: WidgetWidth
  onResize: (width: WidgetWidth) => void
}) {
  // Filter options based on minWidth and maxWidth
  const validOptions = useMemo(() => {
    const minPercentage = WIDTH_TO_PERCENTAGE[minWidth]
    const maxPercentage = WIDTH_TO_PERCENTAGE[maxWidth]

    return Object.entries(WIDTH_TO_PERCENTAGE)
      .map(([key, value]) => ({
        width: key as WidgetWidth,
        percentage: value,
      }))
      .filter((option) => option.percentage >= minPercentage && option.percentage <= maxPercentage)
  }, [minWidth, maxWidth])

  const isDisabled = validOptions.length <= 1

  if (isDisabled) {
    return null
  }

  return (
    <Popup
      button={
        <button
          className="widget-wrapper__size-btn"
          onPointerDown={(e) => e.stopPropagation()}
          type="button"
        >
          <span className="widget-wrapper__size-btn-text">{currentWidth}</span>
          <ChevronIcon className="widget-wrapper__size-btn-icon" />
        </button>
      }
      buttonType="custom"
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

  // Only apply draggable attributes and listeners when not disabled
  // to prevent disabling interactive elements inside the widget
  const draggableProps = props.disabled ? {} : { ...listeners, ...attributes }

  return (
    <div className="widget" data-slug={props.id} data-width={props.width} style={mergedStyles}>
      <DroppableItem id={props.id} position="before" />
      <div
        className="draggable"
        id={props.id}
        ref={setNodeRef}
        {...draggableProps}
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
      className="droppable-widget"
      data-testid={`${id}-${position}`}
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
