import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import type { HTMLAttributes } from 'react'

export type UseDraggableSortableReturn = {
  readonly attributes: HTMLAttributes<unknown>
  readonly isDragging?: boolean
  readonly listeners: SyntheticListenerMap
  readonly setNodeRef: (node: HTMLElement | null) => void
  readonly transform: string
  readonly transition: string
}
