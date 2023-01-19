import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { useSortable } from '@dnd-kit/sortable';

import { Props } from './types';

export const DraggableSortableItem: React.FC<Props> = (props) => {
  const {
    id,
    disabled,
    children,
  } = props;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id,
    disabled,
  });

  return children({
    attributes: {
      ...attributes,
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
      },
    },
    listeners,
    setNodeRef,
    transform: transform && `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  });
};

export default DraggableSortableItem;
