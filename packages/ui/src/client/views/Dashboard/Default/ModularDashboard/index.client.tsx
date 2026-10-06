'use client'

import type { Modifier } from '@dnd-kit/core'
import type { ClientWidget, WidgetWidth } from 'payload'

import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { getTranslation } from '@payloadcms/translations'
import { toWords } from 'payload/shared'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '../../../../elements/Button/index.js'
import { Popup } from '../../../../elements/Popup/index.js'
import * as PopupList from '../../../../elements/Popup/PopupButtonList/index.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { DashboardStepNav } from './DashboardStepNav.js'
import { useDashboardLayout } from './useDashboardLayout.js'
import { closestInXAxis } from './utils/collisionDetection.js'
import { useDashboardSensors } from './utils/sensors.js'
import { WidgetContent } from './WidgetContent/index.js'
import { WidgetEditControl } from './WidgetEditControl.js'

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
  const { i18n, t } = useTranslation()
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
  const [activeControlsWidgetID, setActiveControlsWidgetID] = useState<null | string>(null)
  const sensors = useDashboardSensors()

  useEffect(() => {
    if (!isEditing) {
      setActiveControlsWidgetID(null)
    }
  }, [isEditing])

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
          setActiveDragId(null)

          if (!event.over) {
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
              <p>{t('dashboard:noItems')}</p>
            </div>
          )}
          {currentLayout?.map((widget) => {
            const slug = widget.item.id.slice(0, widget.item.id.lastIndexOf('-'))
            const label = getTranslation(
              widgets.find((widgetConfig) => widgetConfig.slug === slug)?.label ?? toWords(slug),
              i18n,
            )

            return (
              <DraggableItem
                disabled={!isEditing}
                id={widget.item.id}
                key={widget.item.id}
                label={label}
                style={{
                  width: `${WIDTH_TO_PERCENTAGE[widget.item.width]}%`,
                }}
                width={widget.item.width}
              >
                {({ dragHandle }) => (
                  <div
                    className={[
                      'widget-wrapper',
                      isEditing ? 'widget-wrapper--editing' : '',
                      activeControlsWidgetID === widget.item.id
                        ? 'widget-wrapper--controls-active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <WidgetContent id={`${widget.item.id}-content`} isEditing={isEditing}>
                      {widget.component}
                    </WidgetContent>
                    {dragHandle}
                    {isEditing && (
                      <div className="widget-wrapper__controls">
                        <WidgetEditControl
                          onSave={(data) => {
                            updateWidgetData(widget.item.id, data)
                          }}
                          widgetData={widget.item.data}
                          widgetID={widget.item.id}
                          widgetLabel={label}
                        />
                        <WidgetWidthDropdown
                          currentWidth={widget.item.width}
                          maxWidth={widget.item.maxWidth}
                          minWidth={widget.item.minWidth}
                          onOpenChange={(isOpen) => {
                            setActiveControlsWidgetID(isOpen ? widget.item.id : null)
                          }}
                          onResize={(width) => resizeWidget(widget.item.id, width)}
                          widgetLabel={label}
                        />
                        <Button
                          aria-label={t('general:deleteLabel', { label })}
                          buttonStyle="destructive"
                          className="widget-wrapper__delete-btn"
                          extraButtonProps={{ tabIndex: 0 }}
                          icon="x"
                          margin={false}
                          onClick={() => deleteWidget(widget.item.id)}
                          round
                        />
                      </div>
                    )}
                  </div>
                )}
              </DraggableItem>
            )
          })}
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
                      aria-hidden="true"
                      inert
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
  onOpenChange,
  onResize,
  widgetLabel,
}: {
  currentWidth: WidgetWidth
  maxWidth: WidgetWidth
  minWidth: WidgetWidth
  onOpenChange: (isOpen: boolean) => void
  onResize: (width: WidgetWidth) => void
  widgetLabel: string
}) {
  const { t } = useTranslation()

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
      onToggleClose={() => onOpenChange(false)}
      onToggleOpen={onOpenChange}
      popupType="menu"
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
      renderButton={({ active: _active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={t('dashboard:resizeWidget', { label: widgetLabel, size: currentWidth })}
          buttonStyle="secondary"
          className="widget-wrapper__size-btn"
          extraButtonProps={{
            onKeyDown,
            ...ariaProps,
            tabIndex: 0,
          }}
          icon={<ChevronIcon className="widget-wrapper__size-btn-icon" size={16} />}
          margin={false}
          onClick={onClick}
          selected={_active}
        >
          {currentWidth}
        </Button>
      )}
      size="small"
      verticalAlign="bottom"
    />
  )
}

function DraggableItem(props: {
  children: (args: { dragHandle: React.ReactNode }) => React.ReactNode
  disabled?: boolean
  id: string
  label: string
  style?: React.CSSProperties
  width: WidgetWidth
}) {
  const { t } = useTranslation()
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef } = useDraggable({
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
        aria-label={props.label}
        aria-labelledby={props.disabled ? undefined : `${props.id}-content`}
        className="draggable"
        id={props.id}
        ref={setNodeRef}
        role="group"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
        tabIndex={props.disabled ? undefined : 0}
      >
        {props.children({
          dragHandle: !props.disabled && (
            <button
              {...attributes}
              {...listeners}
              aria-describedby={[attributes['aria-describedby'], `${props.id}-content`]
                .filter(Boolean)
                .join(' ')}
              aria-label={t('general:dragToReorder')}
              className="widget-wrapper__edit-overlay widget-wrapper__drag-btn"
              ref={setActivatorNodeRef}
              type="button"
            />
          ),
        })}
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
        backgroundColor: isOver ? 'var(--color-bg-brand-secondary)' : 'transparent',
        marginBottom: '10px',
        marginTop: '10px',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  )
}
