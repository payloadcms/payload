import type { UseDraggableArguments } from '@dnd-kit/core'
// eslint-disable-next-line import/no-unresolved
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import type React from 'react'

import type { UseDraggableSortableReturn } from '../useDraggableSortable/types'

export type DragHandleProps = UseDraggableArguments & {
  attributes: UseDraggableArguments['attributes']
  listeners: SyntheticListenerMap
}

export type ChildFunction = (args: UseDraggableSortableReturn) => React.ReactNode

export type Props = UseDraggableArguments & {
  children: ChildFunction
}
