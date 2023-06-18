import { useSortable } from '@dnd-kit/sortable';
import { UseDraggableArguments } from '@dnd-kit/core';
import { UseDraggableSortableReturn } from './types';

export const useDraggableSortable = (props: UseDraggableArguments): UseDraggableSortableReturn => {
  const {
    id,
    disabled,
  } = props;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id,
    disabled,
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
    transform: transform && `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  };
};
