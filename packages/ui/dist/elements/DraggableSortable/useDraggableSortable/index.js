'use client';

import { c as _c } from "react/compiler-runtime";
import { useSortable } from '@dnd-kit/sortable';
export const useDraggableSortable = props => {
  const $ = _c(17);
  const {
    id,
    disabled
  } = props;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      duration: 250,
      easing: "cubic-bezier(0, 0.2, 0.2, 1)"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] !== disabled || $[2] !== id) {
    t1 = {
      id,
      disabled,
      transition: t0
    };
    $[1] = disabled;
    $[2] = id;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable(t1);
  const t2 = isDragging ? "grabbing" : "grab";
  let t3;
  if ($[4] !== t2 || $[5] !== transition) {
    t3 = {
      cursor: t2,
      transition
    };
    $[4] = t2;
    $[5] = transition;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== attributes || $[8] !== t3) {
    t4 = {
      ...attributes,
      style: t3
    };
    $[7] = attributes;
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const t5 = transform && `translate3d(${transform.x}px, ${transform.y}px, 0)`;
  let t6;
  if ($[10] !== isDragging || $[11] !== listeners || $[12] !== setNodeRef || $[13] !== t4 || $[14] !== t5 || $[15] !== transition) {
    t6 = {
      attributes: t4,
      isDragging,
      listeners,
      setNodeRef,
      transform: t5,
      transition
    };
    $[10] = isDragging;
    $[11] = listeners;
    $[12] = setNodeRef;
    $[13] = t4;
    $[14] = t5;
    $[15] = transition;
    $[16] = t6;
  } else {
    t6 = $[16];
  }
  return t6;
};
//# sourceMappingURL=index.js.map