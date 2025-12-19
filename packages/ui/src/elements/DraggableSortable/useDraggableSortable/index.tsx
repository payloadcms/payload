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
      // TODO: due to a bug in Next.js or react, the useId() we pass to the DnDContext, which is used for the aria-describedBy attribute here, occasionally does not match the server side rendering, even though it should.
      // Issue: https://github.com/vercel/next.js/issues/84029 - revisit this when the issue is fixed.
      suppressHydrationWarning: true,
    },
    isDragging,
    listeners,
    setNodeRef,
    transform: transform && `translate3d(${transform.x}px, ${transform.y}px, 0)`, // translate3d is faster than translate in most browsers
    transition,
  }
}
