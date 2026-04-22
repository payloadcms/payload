import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import type { HTMLAttributes } from 'react'

export type UseDraggableSortableReturn = {
  readonly attributes: HTMLAttributes<unknown>
  readonly isDragging?: boolean
  readonly listeners: NonNullable<DraggableSyntheticListeners>
  readonly setNodeRef: (node: HTMLElement | null) => void
  readonly transform: string
  readonly transition: string
}
