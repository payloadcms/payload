'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { Fragment } from 'react';
import { useDraggableSortable } from '../useDraggableSortable/index.js';
export const DraggableSortableItem = props => {
  const $ = _c(12);
  const {
    id,
    children,
    disabled
  } = props;
  let t0;
  if ($[0] !== disabled || $[1] !== id) {
    t0 = {
      id,
      disabled
    };
    $[0] = disabled;
    $[1] = id;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useDraggableSortable(t0);
  const t1 = isDragging ? "grabbing" : "grab";
  let t2;
  if ($[3] !== attributes || $[4] !== children || $[5] !== isDragging || $[6] !== listeners || $[7] !== setNodeRef || $[8] !== t1 || $[9] !== transform || $[10] !== transition) {
    t2 = _jsx(Fragment, {
      children: children({
        attributes: {
          ...attributes,
          style: {
            cursor: t1
          }
        },
        isDragging,
        listeners,
        setNodeRef,
        transform,
        transition
      })
    });
    $[3] = attributes;
    $[4] = children;
    $[5] = isDragging;
    $[6] = listeners;
    $[7] = setNodeRef;
    $[8] = t1;
    $[9] = transform;
    $[10] = transition;
    $[11] = t2;
  } else {
    t2 = $[11];
  }
  return t2;
};
//# sourceMappingURL=index.js.map