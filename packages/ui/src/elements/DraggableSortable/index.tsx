'use client'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import React, { useCallback, useId, useState } from 'react'

import type { Props } from './types.js'

export { Props }

export const DraggableSortable: React.FC<Props> = (props) => {
  const { children, className, ids, onDragEnd, onDragStart } = props

  // useId() can produce different values between server and client when the
  // component is rendered inside a subtree that is not part of the initial
  // SSR output (e.g. inside a hidden portal or lazily-mounted panel).
  // @dnd-kit derives aria-describedby from the DndContext id, so a mismatch
  // triggers a React hydration warning. Using useState ensures the id is only
  // ever generated on the client, keeping SSR and client in sync.
  // See: https://github.com/clauderic/dnd-kit/issues/926
  const reactId = useId()
  const [dndContextID] = useState(reactId)
  const [sortableContextID] = useState(reactId + '-sortable')

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
      id={dndContextID}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <SortableContext id={sortableContextID} items={ids}>
        <div className={className} ref={setNodeRef}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  )
}
