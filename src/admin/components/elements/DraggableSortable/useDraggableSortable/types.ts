import { HTMLAttributes } from 'react';
/* eslint-disable import/no-unresolved */
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

export type UseDraggableSortableReturn = {
  attributes: HTMLAttributes<unknown>
  listeners: SyntheticListenerMap
  setNodeRef: (node: HTMLElement | null) => void
  transform: string
  isDragging?: boolean
}
