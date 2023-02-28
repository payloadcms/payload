import React from 'react';
import { DragHandleProps } from '../DraggableSortable/DraggableSortableItem/types';

export type Props = {
  collapsed?: boolean
  className?: string
  header?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  onToggle?: (collapsed: boolean) => void
  initCollapsed?: boolean
  dragHandleProps?: DragHandleProps
}
