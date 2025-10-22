'use client'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import React, { useCallback, useId } from 'react'

import type { Props } from './types.js'

export { Props }

export const DraggableSortable: React.FC<Props> = (props) => {
  const { children, className, ids, onDragEnd, onDragOver, onDragStart } = props

  const id = useId()

  const { setNodeRef } = useDroppable({
    id,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event

      if (!active || !over) {
        return
      }

      if (typeof onDragOver === 'function') {
        onDragOver({
          event,
          moveFromIndex: ids.findIndex((_id) => _id === active.id),
          moveToIndex: ids.findIndex((_id) => _id === over.id),
        })
      }
    },
    [onDragOver, ids],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event

      if (!active) {
        return
      }

      if (typeof onDragStart === 'function') {
        onDragStart({ id: active.id, event })
      }
    },
    [onDragStart],
  )

  return (
    <DndContext
      collisionDetection={closestCenter}
      id={id}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <SortableContext items={ids}>
        <div className={className} ref={setNodeRef}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  )
}
