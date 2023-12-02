import type { UseDraggableArguments } from '@dnd-kit/core'

import React, { Fragment } from 'react'

import type { ChildFunction } from './types'

import { useDraggableSortable } from '../useDraggableSortable'

export const DraggableSortableItem: React.FC<
  UseDraggableArguments & {
    children: ChildFunction
  }
> = (props) => {
  const { id, children, disabled } = props

  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggableSortable({
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
        },
        listeners,
        setNodeRef,
        transform,
      })}
    </Fragment>
  )
}

export default DraggableSortableItem
