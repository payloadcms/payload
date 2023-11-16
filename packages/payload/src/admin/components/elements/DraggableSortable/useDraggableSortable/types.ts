/* eslint-disable import/no-unresolved */
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import type { HTMLAttributes } from 'react'

export type UseDraggableSortableReturn = {
  attributes: HTMLAttributes<unknown>
  isDragging?: boolean
  listeners: SyntheticListenerMap
  setNodeRef: (node: HTMLElement | null) => void
  transform: string
}
