/* eslint-disable import/no-extraneous-dependencies */
import type { DragEndEvent } from '@dnd-kit/core'
import type { Ref } from 'react'

export type Props = {
  children: React.ReactNode
  className?: string
  droppableRef?: Ref<HTMLElement>
  ids: string[]
  onDragEnd: (e: { event: DragEndEvent; moveFromIndex: number; moveToIndex: number }) => void
}
