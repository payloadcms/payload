import React, { useCallback, useId } from 'react';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  DragEndEvent,
  useDroppable,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { Props } from './types';

const DraggableSortable: React.FC<Props> = (props) => {
  const {
    onDragEnd,
    ids,
    className,
    children,
  } = props;

  const id = useId();

  const { setNodeRef } = useDroppable({
    id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    if (typeof onDragEnd === 'function') {
      onDragEnd({
        event,
        moveFromIndex: ids.findIndex((_id) => _id === active.id),
        moveToIndex: ids.findIndex((_id) => _id === over.id),
      });
    }
  }, [onDragEnd, ids]);

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <SortableContext items={ids}>
        <div
          className={className}
          ref={setNodeRef}
        >
          {children}
        </div>
      </SortableContext>
    </DndContext>

  );
};

export default DraggableSortable;
