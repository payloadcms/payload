import type React from 'react'

import type { DragHandleProps } from '../DraggableSortable/DraggableSortableItem/types'

export type Props = {
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  collapsed?: boolean
  collapsibleStyle?: 'default' | 'error'
  dragHandleProps?: DragHandleProps
  header?: React.ReactNode
  initCollapsed?: boolean
  onToggle?: (collapsed: boolean) => void
}
