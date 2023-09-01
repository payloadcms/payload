import type { UseDraggableArguments } from '@dnd-kit/core';

import { useSortable } from '@dnd-kit/sortable';

import type { UseDraggableSortableReturn } from './types';

export const useDraggableSortable = (props: UseDraggableArguments): UseDraggableSortableReturn => {
  const {
    disabled,
    id,
  } = props;

  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    disabled,
    id,
  });

  return {
    attributes: {
      ...attributes,
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
      },
    },
    isDragging,
    listeners,
    setNodeRef,
    transform: transform && `translate3d(${transform.x}px, ${transform.y}px, 0)`, // translate3d is faster than translate in most browsers
  };
};
