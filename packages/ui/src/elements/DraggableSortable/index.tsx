'use client'
import type { DragStartEvent, UniqueIdentifier } from '@dnd-kit/core'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import React, { useCallback, useEffect, useId, useState } from 'react'

import type { Props } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

export { Props }

export const DraggableSortable: React.FC<Props> = (props) => {
  const {
    id,
    children,
    className,
    ids,
    onDragEnd,
    onDragStart,
    renderDragOverlay,
    sortingStrategy,
  } = props
  const [activeId, setActiveId] = useState<null | number | string>(null)
  const { t } = useTranslation()

  const getItemLabel = useCallback(
    (itemId: UniqueIdentifier, data?: Record<string, unknown>) => {
      const label = typeof data?.label === 'string' ? data.label : undefined
      const itemIndex = ids.findIndex((_id) => _id === itemId)

      return label || `${t('general:item')} ${itemIndex + 1}`
    },
    [ids, t],
  )

  const getPositionLabel = useCallback(
    (itemId: UniqueIdentifier) => {
      const itemIndex = ids.findIndex((_id) => _id === itemId)

      return `${t('general:row')} ${itemIndex + 1}`
    },
    [ids, t],
  )

  const getMovedAnnouncement = useCallback(
    (
      activeId: UniqueIdentifier,
      activeData: Record<string, unknown> | undefined,
      overId: UniqueIdentifier,
    ) =>
      t('hierarchy:itemsMovedTo', {
        destination: getPositionLabel(overId),
        title: getItemLabel(activeId, activeData),
      }),
    [getItemLabel, getPositionLabel, t],
  )

  // The overlay is a different element than the drag handle, so its inline cursor
  // styles don't carry over. So set a body class to show a grabbing cursor everywhere.
  useEffect(() => {
    if (activeId !== null) {
      document.body.classList.add('is-dragging')
      return () => {
        document.body.classList.remove('is-dragging')
      }
    }
  }, [activeId])

  const dndContextID = useId()
  const sortableContextID = useId()

  const { setNodeRef } = useDroppable({
    id: dndContextID,
  })

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      event.activatorEvent.stopPropagation()
      setActiveId(null)

      if (!active || !over) {
        return
      }

      if (typeof onDragEnd === 'function') {
        onDragEnd({
          event,
          moveFromIndex: ids.findIndex((_id) => _id === active.id),
          moveToIndex: ids.findIndex((_id) => _id === over.id),
        })
      }
    },
    [onDragEnd, ids],
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event

      if (!active) {
        return
      }

      setActiveId(active.id)

      if (typeof onDragStart === 'function') {
        onDragStart({ id: active.id, event })
      }
    },
    [onDragStart],
  )

  return (
    <DndContext
      accessibility={{
        announcements: {
          onDragCancel: ({ active }) =>
            `${getItemLabel(active.id, active.data.current)}: ${t('general:cancel')}`,
          onDragEnd: ({ active, over }) =>
            over
              ? getMovedAnnouncement(active.id, active.data.current, over.id)
              : t('general:cancel'),
          onDragOver: ({ active, over }) =>
            over ? getMovedAnnouncement(active.id, active.data.current, over.id) : '',
          onDragStart: () => t('general:dragToReorder'),
        },
        screenReaderInstructions: {
          draggable: `${t('general:dragToReorder')}. ${t('general:moveUp')} / ${t(
            'general:moveDown',
          )}. ${t('general:cancel')}.`,
        },
      }}
      collisionDetection={closestCenter}
      // Provide stable ID to fix hydration issues: https://github.com/clauderic/dnd-kit/issues/926
      id={dndContextID}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <SortableContext
        // Provide stable ID to fix hydration issues: https://github.com/clauderic/dnd-kit/issues/926
        id={sortableContextID}
        items={ids}
        strategy={sortingStrategy}
      >
        <div className={className} id={id} ref={setNodeRef}>
          {children}
        </div>
      </SortableContext>
      {renderDragOverlay && activeId !== null && (
        <DragOverlay dropAnimation={null}>{renderDragOverlay(activeId)}</DragOverlay>
      )}
    </DndContext>
  )
}
