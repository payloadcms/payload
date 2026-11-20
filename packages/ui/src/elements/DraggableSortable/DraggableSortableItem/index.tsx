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

  const draggableSortableProps = useDraggableSortable({
    id,
    disabled,
  })

  return <Fragment>{children(draggableSortableProps)}</Fragment>
}
