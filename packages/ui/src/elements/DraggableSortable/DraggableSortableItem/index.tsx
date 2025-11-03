'use client'
import type { UseDraggableArguments } from '@dnd-kit/core'

import React, { Fragment } from 'react'

import type { ChildFunction } from './types.js'

import { useDraggableSortable } from '../useDraggableSortable/index.js'

export const DraggableSortableItem: React.FC<
  {
    children: ChildFunction
  } & UseDraggableArguments
> = (props) => {
  const { id, children, disabled } = props

  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useDraggableSortable({
      id,
      disabled,
    })

  return (
    <Fragment>
      {children({
        attributes: {
          ...attributes,
          style: {
            cursor: isDragging ? 'grabbing' : 'grab',
          },
          // TODO: due to a bug in Next.js or react, the useId() we pass to the DnDContext, which is used for the aria-describedBy attribute here, occasionally does not match the server side rendering, even though it should.
          // Issue: https://github.com/vercel/next.js/issues/84029 - revisit this when the issue is fixed.
          suppressHydrationWarning: true,
        },
        isDragging,
        listeners,
        setNodeRef,
        transform,
        transition,
      })}
    </Fragment>
  )
}
