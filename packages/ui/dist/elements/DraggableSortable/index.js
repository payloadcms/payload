'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import React, { useCallback, useId } from 'react';
export const DraggableSortable = props => {
  const $ = _c(18);
  const {
    children,
    className,
    ids,
    onDragEnd,
    onDragStart
  } = props;
  const id = useId();
  let t0;
  if ($[0] !== id) {
    t0 = {
      id
    };
    $[0] = id;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const {
    setNodeRef
  } = useDroppable(t0);
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      activationConstraint: {
        distance: 5
      }
    };
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = {
      coordinateGetter: sortableKeyboardCoordinates
    };
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const sensors = useSensors(useSensor(PointerSensor, t1), useSensor(KeyboardSensor, t2));
  let t3;
  if ($[4] !== ids || $[5] !== onDragEnd) {
    t3 = event => {
      const {
        active,
        over
      } = event;
      event.activatorEvent.stopPropagation();
      if (!active || !over) {
        return;
      }
      if (typeof onDragEnd === "function") {
        onDragEnd({
          event,
          moveFromIndex: ids.findIndex(_id => _id === active.id),
          moveToIndex: ids.findIndex(_id_0 => _id_0 === over.id)
        });
      }
    };
    $[4] = ids;
    $[5] = onDragEnd;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const handleDragEnd = t3;
  let t4;
  if ($[7] !== onDragStart) {
    t4 = event_0 => {
      const {
        active: active_0
      } = event_0;
      if (!active_0) {
        return;
      }
      if (typeof onDragStart === "function") {
        onDragStart({
          id: active_0.id,
          event: event_0
        });
      }
    };
    $[7] = onDragStart;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  const handleDragStart = t4;
  let t5;
  if ($[9] !== children || $[10] !== className || $[11] !== handleDragEnd || $[12] !== handleDragStart || $[13] !== id || $[14] !== ids || $[15] !== sensors || $[16] !== setNodeRef) {
    t5 = _jsx(DndContext, {
      collisionDetection: closestCenter,
      id,
      onDragEnd: handleDragEnd,
      onDragStart: handleDragStart,
      sensors,
      children: _jsx(SortableContext, {
        items: ids,
        children: _jsx("div", {
          className,
          ref: setNodeRef,
          children
        })
      })
    });
    $[9] = children;
    $[10] = className;
    $[11] = handleDragEnd;
    $[12] = handleDragStart;
    $[13] = id;
    $[14] = ids;
    $[15] = sensors;
    $[16] = setNodeRef;
    $[17] = t5;
  } else {
    t5 = $[17];
  }
  return t5;
};
//# sourceMappingURL=index.js.map