'use client'
import type { UseDraggableArguments } from '@dnd-kit/core'

import { useSortable } from '@dnd-kit/sortable'

import type { UseDraggableSortableReturn } from './types.js'

export const useDraggableSortable = (props: UseDraggableArguments): UseDraggableSortableReturn => {
  const { id, disabled } = props

  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    disabled,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0, 0.2, 0.2, 1)',
    },
  })

  return {
    attributes: {
      ...attributes,
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
        transition,
      },
    },
    isDragging,
    listeners,
    setNodeRef,
    transform: transform && `translate3d(${transform.x}px, ${transform.y}px, 0)`, // translate3d is faster than translate in most browsers
    transition,
  }
}
