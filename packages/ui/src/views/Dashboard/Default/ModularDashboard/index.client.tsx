'use client'

import type { Announcements, CollisionDetection, Modifier, UniqueIdentifier } from '@dnd-kit/core'
import type { ClientWidget, WidgetWidth } from 'payload'

import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { getTranslation } from '@payloadcms/translations'
import { toWords } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { DrawerWidgetDragData } from './utils/getDrawerWidgetDrop.js'

import { Button } from '../../../../elements/Button/index.js'
import { useModal } from '../../../../elements/Modal/index.js'
import { Popup } from '../../../../elements/Popup/index.js'
import * as PopupList from '../../../../elements/Popup/PopupButtonList/index.js'
import { ThumbnailCard } from '../../../../elements/ThumbnailCard/index.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { TrashIcon } from '../../../../icons/Trash/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { DashboardStepNav } from './DashboardStepNav.js'
import { EmptyDropTarget } from './EmptyDropTarget/index.js'
import { RowDropTargets } from './RowDropTargets/index.js'
import { useDashboardLayout } from './useDashboardLayout.js'
import { closestInXAxis } from './utils/collisionDetection.js'
import {
  getDrawerWidgetDragData,
  getDrawerWidgetDragID,
  getDrawerWidgetDrop,
  getDrawerWidgetItem,
} from './utils/getDrawerWidgetDrop.js'
import {
  getValidSideDropTargets,
  getWidgetDropSizing,
  isValidWidgetDropTarget,
} from './utils/getValidSideDropTargets.js'
import { getWidgetIDFromDropTarget, getWidgetMoveIndexes } from './utils/getWidgetMoveIndexes.js'
import { WIDTH_TO_PERCENTAGE } from './utils/resizeWidget.js'
import { useDashboardSensors } from './utils/sensors.js'
import { getLayoutRows, placeWidgetInLayout } from './utils/widgetLayoutRows.js'
import { WidgetContent } from './WidgetContent/index.js'
import { WidgetEditControl } from './WidgetEditControl.js'
import { WidgetReplaceControl } from './WidgetReplaceControl/index.js'
import { WidgetResizeHandles } from './WidgetResizeHandles/index.js'
import { WidgetSelectControl } from './WidgetSelectControl/index.js'

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
  startsNewRow?: boolean
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
export function ModularDashboardClient({
  clientLayout: initialLayout,
  widgets,
}: {
  clientLayout: WidgetInstanceClient[]
  widgets: ClientWidget[]
}) {
  const { i18n, t } = useTranslation()
  const { closeModal, modalState, openModal } = useModal()
  const hasOpenModal = Object.values(modalState).some(({ isOpen }) => isOpen)
  const {
    addWidget,
    cancel,
    cancelModal,
    currentLayout,
    deleteWidget,
    finishWidgetResize,
    isEditing,
    moveWidget,
    replaceWidget,
    resetLayout,
    resizeWidget,
    saveLayout,
    setIsEditing,
    startWidgetResize,
    updateWidgetData,
  } = useDashboardLayout(initialLayout)

  const [activeDragId, setActiveDragId] = useState<null | string>(null)
  const [drawerDrag, setDrawerDrag] = useState<DrawerWidgetDragData | null>(null)
  const [selectedWidgetID, setSelectedWidgetID] = useState<null | string>(null)
  const widgetInteractionEventRef = useRef<Event | null>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const sensors = useDashboardSensors()
  const validSideDropTargets = useMemo(
    () =>
      activeDragId === null
        ? null
        : getValidSideDropTargets({
            activeID: activeDragId,
            activeWidget: drawerDrag
              ? getDrawerWidgetItem({ widget: drawerDrag.widget })
              : undefined,
            layout: currentLayout.map(({ item }) => item),
          }),
    [activeDragId, currentLayout, drawerDrag],
  )

  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      if (
        (drawerDrag || getDrawerWidgetDragData({ data: args.active.data.current })) &&
        args.pointerCoordinates
      ) {
        const rect = dashboardRef.current?.getBoundingClientRect()
        const { x, y } = args.pointerCoordinates

        if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          return []
        }
      }
      return closestInXAxis(args)
    },
    [drawerDrag],
  )

  useEffect(() => {
    if (!drawerDrag) {
      return
    }
    // Let dnd-kit measure the source before the drawer unmounts it.
    const frame = requestAnimationFrame(() => closeModal(drawerDrag.drawerSlug))

    return () => cancelAnimationFrame(frame)
  }, [closeModal, drawerDrag])

  const restoreDrawer = useCallback(
    (source: DrawerWidgetDragData) => {
      openModal(source.drawerSlug)
      requestAnimationFrame(() =>
        document.getElementById(getDrawerWidgetDragID({ slug: source.widget.slug }))?.focus(),
      )
    },
    [openModal],
  )

  useEffect(() => {
    if (activeDragId !== null) {
      document.body.classList.add('is-dragging')
      return () => {
        document.body.classList.remove('is-dragging')
      }
    }
  }, [activeDragId])

  const announcements = useMemo<Announcements>(() => {
    const describeWidget = ({ id, index }: { id: UniqueIdentifier; index?: number }) => {
      const widgetID = getWidgetIDFromDropTarget({ id })
      const source = widgets.find(({ slug }) => getDrawerWidgetDragID({ slug }) === widgetID)
      const slug = source?.slug ?? widgetID.slice(0, widgetID.lastIndexOf('-'))
      const label = getTranslation(
        widgets.find((widget) => widget.slug === slug)?.label ?? toWords(slug),
        i18n,
      )
      const position = index ?? currentLayout.findIndex((widget) => widget.item.id === widgetID)

      return source ? label : `${label}, ${t('general:order')}: ${position + 1}`
    }
    const describeTargetResize = (target?: { widgetID: string; width: WidgetWidth }) => {
      if (!target) {
        return ''
      }
      const slug = target.widgetID.slice(0, target.widgetID.lastIndexOf('-'))
      const label = getTranslation(
        widgets.find((widget) => widget.slug === slug)?.label ?? toWords(slug),
        i18n,
      )

      return `. ${label}: ${t('upload:width')}: ${WIDTH_TO_PERCENTAGE[target.width].toFixed(0)}%`
    }
    const describeRowDestination = ({
      overID,
      resizeTarget,
      widget,
    }: {
      overID: string
      resizeTarget?: { widgetID: string; width: WidgetWidth }
      widget: WidgetInstanceClient
    }) => {
      const planned = placeWidgetInLayout({ layout: currentLayout, overID, resizeTarget, widget })
      const rowIndex = getLayoutRows({ layout: planned, getItem: ({ item }) => item }).findIndex(
        (row) => row.some(({ item }) => item.id === widget.item.id),
      )

      return `${t('general:row')} ${rowIndex + 1}`
    }
    const announceCancel: Announcements['onDragCancel'] = ({ active }) =>
      `${t('general:cancel')}: ${describeWidget({ id: active.id })}`
    const announceMove: NonNullable<Announcements['onDragOver']> = ({ active, over }) => {
      const sourceWidget =
        getDrawerWidgetDragData({ data: active.data.current })?.widget ??
        drawerDrag?.widget ??
        widgets.find(({ slug }) => getDrawerWidgetDragID({ slug }) === active.id)

      if (sourceWidget) {
        const drop = over
          ? getDrawerWidgetDrop({
              widget: sourceWidget,
              layout: currentLayout.map(({ item }) => item),
              overID: String(over.id),
            })
          : null

        return drop
          ? `${t('hierarchy:itemsMovedTo', {
              title: describeWidget({ id: active.id }),
              destination: /-row-(?:before|after)$/.test(String(over!.id))
                ? describeRowDestination({
                    overID: String(over!.id),
                    resizeTarget: drop.resizeTarget,
                    widget: {
                      component: null,
                      item: { ...getDrawerWidgetItem({ widget: sourceWidget }), width: drop.width },
                    },
                  })
                : `${t('general:dashboard')}, ${t('general:order')}: ${drop.index + 1}`,
            })}. ${t('upload:width')}: ${WIDTH_TO_PERCENTAGE[drop.width].toFixed(0)}%${describeTargetResize(drop.resizeTarget)}`
          : undefined
      }
      if (
        !over ||
        !isValidWidgetDropTarget({
          activeID: String(active.id),
          layout: currentLayout.map(({ item }) => item),
          overID: String(over.id),
        })
      ) {
        return undefined
      }
      const { moveToIndex } = getWidgetMoveIndexes({
        activeID: active.id,
        layout: currentLayout,
        overID: over.id,
      })

      const sizing = getWidgetDropSizing({
        activeID: String(active.id),
        layout: currentLayout.map(({ item }) => item),
        overID: String(over.id),
      })
      const activeWidget = currentLayout.find(({ item }) => item.id === active.id)!
      const message = t('hierarchy:itemsMovedTo', {
        title: describeWidget({ id: active.id }),
        destination:
          /-row-(?:before|after)$/.test(String(over.id)) && sizing
            ? describeRowDestination({
                overID: String(over.id),
                resizeTarget: sizing.resizeTarget,
                widget: {
                  ...activeWidget,
                  item: {
                    ...activeWidget.item,
                    width: sizing.width,
                  },
                },
              })
            : describeWidget({ id: over.id, index: moveToIndex }),
      })
      const currentWidth = activeWidget.item.width

      const resizedMessage =
        sizing && sizing.width !== currentWidth
          ? `${message}. ${t('upload:width')}: ${WIDTH_TO_PERCENTAGE[sizing.width].toFixed(0)}%`
          : message

      return `${resizedMessage}${describeTargetResize(sizing?.resizeTarget)}`
    }

    return {
      onDragCancel: announceCancel,
      onDragEnd: (event) => {
        if (String(event.active.id).startsWith('dashboard-picker:')) {
          return announceMove(event) ?? announceCancel(event)
        }
        if (
          event.over &&
          isValidWidgetDropTarget({
            activeID: String(event.active.id),
            layout: currentLayout.map(({ item }) => item),
            overID: String(event.over.id),
          })
        ) {
          const { moveFromIndex, moveToIndex } = getWidgetMoveIndexes({
            activeID: event.active.id,
            layout: currentLayout,
            overID: event.over.id,
          })

          const sizing = getWidgetDropSizing({
            activeID: String(event.active.id),
            layout: currentLayout.map(({ item }) => item),
            overID: String(event.over.id),
          })

          if (
            moveFromIndex !== moveToIndex ||
            sizing?.width !== currentLayout[moveFromIndex]?.item.width ||
            sizing?.resizeTarget ||
            (/-row-(?:before|after)$/.test(String(event.over.id)) &&
              sizing &&
              placeWidgetInLayout({
                layout: currentLayout,
                overID: String(event.over.id),
                widget: {
                  ...currentLayout[moveFromIndex],
                  item: { ...currentLayout[moveFromIndex].item, width: sizing.width },
                },
              }) !== currentLayout)
          ) {
            return announceMove(event)
          }
        }

        return announceCancel(event)
      },
      onDragOver: (event) => {
        const message = announceMove(event)

        return message ? `${t('general:move')}: ${message}` : undefined
      },
      onDragStart: ({ active }) =>
        `${t('general:dragToReorder')}: ${describeWidget({ id: active.id })}`,
    }
  }, [currentLayout, drawerDrag, i18n, t, widgets])

  useEffect(() => {
    if (!isEditing) {
      setSelectedWidgetID(null)
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) {
      return
    }

    const deselectOutsideWidget = (event: MouseEvent) => {
      const isWidgetInteraction = widgetInteractionEventRef.current === event

      widgetInteractionEventRef.current = null
      if (!isWidgetInteraction) {
        setSelectedWidgetID(null)
      }
    }

    document.addEventListener('click', deselectOutsideWidget)
    return () => document.removeEventListener('click', deselectOutsideWidget)
  }, [isEditing])

  return (
    <div>
      <DndContext
        accessibility={{ announcements }}
        autoScroll={{
          enabled: true,
          threshold: {
            x: 0, // No horizontal scroll
            y: 0.2, // Allow vertical scroll at 20% from edge
          },
        }}
        collisionDetection={collisionDetection}
        // https://github.com/clauderic/dnd-kit/issues/926#issuecomment-1640115665
        id="dashboard-dnd-context"
        onDragCancel={() => {
          setActiveDragId(null)
          if (drawerDrag) {
            restoreDrawer(drawerDrag)
            setDrawerDrag(null)
          }
        }}
        onDragEnd={(event) => {
          setActiveDragId(null)
          const source = getDrawerWidgetDragData({ data: event.active.data.current }) ?? drawerDrag

          if (source) {
            const drop = event.over
              ? getDrawerWidgetDrop({
                  widget: source.widget,
                  layout: currentLayout.map(({ item }) => item),
                  overID: String(event.over.id),
                })
              : null

            setDrawerDrag(null)
            if (drop) {
              addWidget({ ...drop, overID: String(event.over!.id), widgetSlug: source.widget.slug })
            } else {
              restoreDrawer(source)
            }
            return
          }

          if (
            !event.over ||
            !isValidWidgetDropTarget({
              activeID: String(event.active.id),
              layout: currentLayout.map(({ item }) => item),
              overID: String(event.over.id),
            })
          ) {
            return
          }
          const indexes = getWidgetMoveIndexes({
            activeID: event.active.id,
            layout: currentLayout,
            overID: event.over.id,
          })

          const sizing = getWidgetDropSizing({
            activeID: String(event.active.id),
            layout: currentLayout.map(({ item }) => item),
            overID: String(event.over.id),
          })

          if (sizing !== null) {
            moveWidget({ ...indexes, ...sizing, overID: String(event.over.id) })
          }
        }}
        onDragStart={(event) => {
          const source = getDrawerWidgetDragData({ data: event.active.data.current })

          setActiveDragId(String(event.active.id))
          if (source) {
            setSelectedWidgetID(null)
            setDrawerDrag(source)
          } else {
            setSelectedWidgetID(String(event.active.id))
          }
        }}
        sensors={sensors}
      >
        <div
          className={`modular-dashboard ${isEditing ? 'editing' : ''} ${hasOpenModal ? 'modular-dashboard--modal-open' : ''}`}
          ref={dashboardRef}
        >
          {currentLayout?.length === 0 &&
            (drawerDrag ? (
              <EmptyDropTarget />
            ) : (
              <div className="modular-dashboard__empty">
                <p>{t('dashboard:noItems')}</p>
              </div>
            ))}
          {currentLayout?.map((widget, index) => {
            const slug = widget.item.id.slice(0, widget.item.id.lastIndexOf('-'))
            const widgetConfig = widgets.find((widgetConfig) => widgetConfig.slug === slug)
            const label = getTranslation(widgetConfig?.label ?? toWords(slug), i18n)

            return (
              <DraggableItem
                canDropAfter={
                  validSideDropTargets === null ||
                  validSideDropTargets.has(`${widget.item.id}-after`)
                }
                canDropBefore={
                  validSideDropTargets === null ||
                  validSideDropTargets.has(`${widget.item.id}-before`)
                }
                disabled={!isEditing}
                id={widget.item.id}
                index={index}
                isSelected={selectedWidgetID === widget.item.id}
                key={widget.item.id}
                label={label}
                onSelect={() => setSelectedWidgetID(widget.item.id)}
                startsNewRow={widget.item.startsNewRow}
                style={
                  {
                    '--widget-columns': Math.round(
                      (WIDTH_TO_PERCENTAGE[widget.item.width] * 12) / 100,
                    ),
                  } as React.CSSProperties
                }
                width={widget.item.width}
              >
                {({ dragHandle }) => (
                  <div
                    className={[
                      'widget-wrapper',
                      isEditing ? 'widget-wrapper--editing' : '',
                      selectedWidgetID === widget.item.id ? 'widget-wrapper--controls-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClickCapture={(event) => {
                      // React capture includes this widget's portaled menus and drawers.
                      widgetInteractionEventRef.current = event.nativeEvent
                    }}
                  >
                    <WidgetContent id={`${widget.item.id}-content`} isEditing={isEditing}>
                      {widget.component}
                    </WidgetContent>
                    {dragHandle}
                    {isEditing && (
                      <div
                        aria-label={t('general:editLabel', { label })}
                        className="widget-wrapper__controls"
                        data-theme="dark"
                        id={`${widget.item.id}-controls`}
                        role="group"
                      >
                        <WidgetWidthDropdown
                          currentWidth={widget.item.width}
                          maxWidth={widget.item.maxWidth}
                          minWidth={widget.item.minWidth}
                          onOpenChange={(isOpen) => {
                            if (isOpen) {
                              setSelectedWidgetID(widget.item.id)
                            }
                          }}
                          onResize={(width) => resizeWidget({ widgetID: widget.item.id, width })}
                          widgetLabel={label}
                        />
                        {widgetConfig?.controls?.map((control) => (
                          <WidgetSelectControl
                            control={control}
                            key={control.name}
                            onChange={({ value }) => {
                              updateWidgetData(widget.item.id, {
                                ...widget.item.data,
                                [control.name]: value,
                              })
                            }}
                            value={widget.item.data?.[control.name]}
                            widgetLabel={label}
                          />
                        ))}
                        <WidgetEditControl
                          onSave={(data) => {
                            updateWidgetData(widget.item.id, data)
                          }}
                          widgetData={widget.item.data}
                          widgetID={widget.item.id}
                          widgetLabel={label}
                        />
                        <WidgetReplaceControl
                          onReplace={({ widgetSlug }) => {
                            const newWidgetID = replaceWidget({
                              widgetID: widget.item.id,
                              widgetSlug,
                            })

                            if (newWidgetID) {
                              setSelectedWidgetID(newWidgetID)
                            }
                          }}
                          widgetLabel={label}
                          widgets={widgets}
                        />
                        <Button
                          aria-label={t('general:deleteLabel', { label })}
                          buttonStyle="ghost"
                          className="widget-wrapper__delete-btn"
                          extraButtonProps={{ tabIndex: 0 }}
                          icon={<TrashIcon />}
                          margin={false}
                          onClick={() => deleteWidget(widget.item.id)}
                        />
                      </div>
                    )}
                    {isEditing &&
                      selectedWidgetID === widget.item.id &&
                      !hasOpenModal &&
                      activeDragId === null && (
                        <WidgetResizeHandles
                          maxWidth={widget.item.maxWidth}
                          minWidth={widget.item.minWidth}
                          onResize={({ edge, width }) =>
                            resizeWidget({ edge, widgetID: widget.item.id, width })
                          }
                          onResizeEnd={finishWidgetResize}
                          onResizeStart={() => startWidgetResize(widget.item.id)}
                          widgetLabel={label}
                          width={widget.item.width}
                        />
                      )}
                  </div>
                )}
              </DraggableItem>
            )
          })}
          {activeDragId !== null && (
            <RowDropTargets dashboardRef={dashboardRef} layout={currentLayout} />
          )}
          <DragOverlay
            className="drag-overlay"
            dropAnimation={{
              duration: 100,
            }}
            // Uses custom modifier that only applies for pointer, not keyboard navigation.
            modifiers={[snapCenterToCursorOnlyForPointer]}
          >
            {drawerDrag ? (
              <div
                aria-hidden="true"
                className="items-drawer--widgets dashboard-widget-drag-preview"
                inert
              >
                <ThumbnailCard
                  description={
                    drawerDrag.widget.description
                      ? getTranslation(drawerDrag.widget.description, i18n)
                      : undefined
                  }
                  label={getTranslation(
                    drawerDrag.widget.label ?? toWords(drawerDrag.widget.slug),
                    i18n,
                  )}
                  thumbnail={null}
                />
              </div>
            ) : activeDragId ? (
              (() => {
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
                    <div className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}>
                      <div className="widget-content">{draggedWidget.component}</div>
                    </div>
                  </div>
                ) : null
              })()
            ) : null}
          </DragOverlay>
        </div>
        <DashboardStepNav
          addWidget={addWidget}
          cancel={cancel}
          isEditing={isEditing}
          resetLayout={resetLayout}
          saveLayout={saveLayout}
          setIsEditing={setIsEditing}
          widgets={widgets}
        />
      </DndContext>
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
    <>
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
            buttonStyle="ghost"
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
      <span aria-hidden="true" className="widget-wrapper__controls-divider" />
    </>
  )
}

function DraggableItem(props: {
  canDropAfter: boolean
  canDropBefore: boolean
  children: (args: { dragHandle: React.ReactNode }) => React.ReactNode
  disabled?: boolean
  id: string
  index: number
  isSelected: boolean
  label: string
  onSelect: () => void
  startsNewRow?: boolean
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
    <div
      className={`widget${props.isSelected ? ' widget--selected' : ''}`}
      data-slug={props.id}
      data-starts-new-row={props.startsNewRow || undefined}
      data-widget-index={props.index}
      data-width={props.width}
      style={mergedStyles}
    >
      <DroppableItem
        id={props.id}
        index={props.index}
        isEnabled={props.canDropBefore}
        position="before"
      />
      <div
        aria-label={props.label}
        aria-labelledby={props.disabled ? undefined : `${props.id}-content`}
        className="draggable"
        id={props.id}
        onFocus={props.disabled ? undefined : props.onSelect}
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
              aria-controls={`${props.id}-controls`}
              aria-describedby={[attributes['aria-describedby'], `${props.id}-content`]
                .filter(Boolean)
                .join(' ')}
              aria-expanded={props.isSelected}
              aria-label={t('general:dragToReorder')}
              className="widget-wrapper__edit-overlay widget-wrapper__drag-btn"
              onClick={props.onSelect}
              ref={setActivatorNodeRef}
              type="button"
            />
          ),
        })}
      </div>
      <DroppableItem
        id={props.id}
        index={props.index + 1}
        isEnabled={props.canDropAfter}
        position="after"
      />
    </div>
  )
}

function DroppableItem({
  id,
  index,
  isEnabled,
  position,
}: {
  id: string
  index: number
  isEnabled: boolean
  position: 'after' | 'before'
}) {
  const droppableArgs = useMemo(
    () => ({ id: `${id}-${position}`, data: { position }, disabled: !isEnabled }),
    [id, isEnabled, position],
  )
  const { setNodeRef, isOver } = useDroppable(droppableArgs)

  return (
    <div
      className="droppable-widget"
      data-drop-index={index}
      data-testid={`${id}-${position}`}
      hidden={!isEnabled}
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
