/* eslint-disable import/no-extraneous-dependencies */
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
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import React, { useCallback, useId } from 'react';

import { Props } from './types';

const DraggableSortable: React.FC<Props> = ({ onDragEnd, ids, className, children }) => {
  const id = useId();

  const { setNodeRef } = useDroppable({
    id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const _onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    onDragEnd({
      event,
      moveFromIndex: ids.findIndex((_id) => _id === active.id),
      moveToIndex: ids.findIndex((_id) => _id === over.id),
    });
  }, [onDragEnd, ids]);

  return (
    <DndContext
      onDragEnd={_onDragEnd}
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
