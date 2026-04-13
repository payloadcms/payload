import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Ref } from 'react'

export type Props = {
  children: React.ReactNode
  className?: string
  droppableRef?: Ref<HTMLElement>
  ids: string[]
  onDragEnd: (e: { event: DragEndEvent; moveFromIndex: number; moveToIndex: number }) => void
  onDragStart?: (e: { event: DragStartEvent; id: number | string }) => void
}
