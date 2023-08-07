import { UseDraggableArguments } from '@dnd-kit/core';
import React, { Fragment } from 'react';
import { useDraggableSortable } from '../useDraggableSortable';
import { ChildFunction } from './types';

export const DraggableSortableItem: React.FC<UseDraggableArguments & {
  children: ChildFunction
}> = (props) => {
  const {
    id,
    disabled,
    children,
  } = props;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggableSortable({
    id,
    disabled,
  });

  return (
    <Fragment>
      {children({
        attributes: {
          ...attributes,
          style: {
            cursor: isDragging ? 'grabbing' : 'grab',
          },
        },
        listeners,
        setNodeRef,
        transform,
      })}
    </Fragment>
  );
};

export default DraggableSortableItem;
