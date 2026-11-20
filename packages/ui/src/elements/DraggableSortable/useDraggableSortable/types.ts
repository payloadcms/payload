import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities/index.js'
import type { HTMLAttributes } from 'react'

export type UseDraggableSortableReturn = {
  readonly activeIndex?: number
  readonly attributes: HTMLAttributes<unknown>
  readonly index?: number
  readonly isDragging?: boolean
  readonly isOver?: boolean
  readonly isSorting?: boolean
  readonly listeners: SyntheticListenerMap
  readonly overIndex?: number
  readonly setActivatorNodeRef?: (node: HTMLElement | null) => void
  readonly setNodeRef: (node: HTMLElement | null) => void
  readonly transform: string
  readonly transition: string
}
