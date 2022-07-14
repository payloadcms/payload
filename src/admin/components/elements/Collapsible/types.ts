import React from 'react';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';

export type Props = {
  collapsed?: boolean
  className?: string
  header?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  onToggle?: (collapsed: boolean) => void
  initCollapsed?: boolean
  dragHandleProps?: DraggableProvidedDragHandleProps
}
