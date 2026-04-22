import type { DraggableSyntheticListeners, UseDraggableArguments } from '@dnd-kit/core'
import type React from 'react'

import type { UseDraggableSortableReturn } from '../useDraggableSortable/types.js'

export type DragHandleProps = {
  attributes: UseDraggableArguments['attributes']
  listeners: NonNullable<DraggableSyntheticListeners>
} & UseDraggableArguments

export type ChildFunction = (args: UseDraggableSortableReturn) => React.ReactNode

export type Props = {
  children: ChildFunction
} & UseDraggableArguments
