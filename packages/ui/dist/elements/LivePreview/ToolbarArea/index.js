'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import './index.scss';
const baseClass = 'toolbar-area';
export const ToolbarArea = props => {
  const $ = _c(4);
  const {
    children
  } = props;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      id: "live-preview-area"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const {
    setNodeRef
  } = useDroppable(t0);
  let t1;
  if ($[1] !== children || $[2] !== setNodeRef) {
    t1 = _jsx("div", {
      className: baseClass,
      ref: setNodeRef,
      children
    });
    $[1] = children;
    $[2] = setNodeRef;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
};
//# sourceMappingURL=index.js.map