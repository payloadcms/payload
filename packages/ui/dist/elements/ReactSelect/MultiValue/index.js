'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { components as SelectComponents } from 'react-select';
import { useDraggableSortable } from '../../DraggableSortable/useDraggableSortable/index.js';
import './index.scss';
const baseClass = 'multi-value';
export function generateMultiValueDraggableID(optionData, valueFunction) {
  return typeof valueFunction === 'function' ? valueFunction(optionData) : optionData?.value;
}
export const MultiValue = props => {
  const $ = _c(26);
  const {
    className,
    data,
    innerProps,
    isDisabled,
    selectProps: t0
  } = props;
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? {} : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const {
    customProps: t2,
    getOptionValue,
    isSortable
  } = t1;
  let t3;
  if ($[2] !== t2) {
    t3 = t2 === undefined ? {} : t2;
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const {
    disableMouseDown
  } = t3;
  let t4;
  if ($[4] !== data || $[5] !== getOptionValue) {
    t4 = generateMultiValueDraggableID(data, getOptionValue);
    $[4] = data;
    $[5] = getOptionValue;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  const id = t4;
  const t5 = !isSortable;
  let t6;
  if ($[7] !== id || $[8] !== t5) {
    t6 = {
      id,
      disabled: t5
    };
    $[7] = id;
    $[8] = t5;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform
  } = useDraggableSortable(t6);
  const t7 = !isDisabled && isSortable && "draggable";
  const t8 = isDragging && `${baseClass}--is-dragging`;
  let t9;
  if ($[10] !== className || $[11] !== t7 || $[12] !== t8) {
    t9 = [baseClass, className, t7, t8].filter(Boolean);
    $[10] = className;
    $[11] = t7;
    $[12] = t8;
    $[13] = t9;
  } else {
    t9 = $[13];
  }
  const classes = t9.join(" ");
  let t10;
  if ($[14] !== attributes || $[15] !== classes || $[16] !== disableMouseDown || $[17] !== innerProps || $[18] !== isSortable || $[19] !== listeners || $[20] !== props || $[21] !== setNodeRef || $[22] !== transform) {
    let t11;
    if ($[24] !== disableMouseDown) {
      t11 = e => {
        if (!disableMouseDown) {
          e.stopPropagation();
        }
      };
      $[24] = disableMouseDown;
      $[25] = t11;
    } else {
      t11 = $[25];
    }
    t10 = _jsx(React.Fragment, {
      children: _jsx(SelectComponents.MultiValue, {
        ...props,
        className: classes,
        innerProps: {
          ...(isSortable ? {
            ...attributes,
            ...listeners
          } : {}),
          ...innerProps,
          onMouseDown: t11,
          ref: setNodeRef,
          style: isSortable ? {
            transform,
            ...attributes?.style
          } : {}
        }
      })
    });
    $[14] = attributes;
    $[15] = classes;
    $[16] = disableMouseDown;
    $[17] = innerProps;
    $[18] = isSortable;
    $[19] = listeners;
    $[20] = props;
    $[21] = setNodeRef;
    $[22] = transform;
    $[23] = t10;
  } else {
    t10 = $[23];
  }
  return t10;
};
//# sourceMappingURL=index.js.map