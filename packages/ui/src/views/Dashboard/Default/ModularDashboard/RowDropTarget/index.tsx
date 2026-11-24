'use client'

import { useDroppable } from '@dnd-kit/core'
import { useMemo } from 'react'

import './index.css'

export function RowDropTarget({
  index,
  position,
  top,
  widgetID,
}: {
  index: number
  position: 'after' | 'before'
  top: number
  widgetID: string
}) {
  const id = `${widgetID}-row-${position}`
  const droppableArgs = useMemo(
    () => ({ id, data: { position: `row-${position}` } }),
    [id, position],
  )
  const { isOver, setNodeRef } = useDroppable(droppableArgs)

  return (
    <div
      aria-hidden="true"
      className={`dashboard-row-drop-target${isOver ? ' dashboard-row-drop-target--active' : ''}`}
      data-drop-index={index}
      data-testid={id}
      ref={setNodeRef}
      style={{ top }}
    />
  )
}
