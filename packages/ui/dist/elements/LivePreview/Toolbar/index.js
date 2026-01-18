'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDraggable } from '@dnd-kit/core';
import React from 'react';
import { DragHandleIcon } from '../../../icons/DragHandle/index.js';
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js';
import { ToolbarControls } from './Controls/index.js';
import './index.scss';
const baseClass = 'live-preview-toolbar';
const DraggableToolbar = props => {
  const $ = _c(10);
  const {
    toolbarPosition
  } = useLivePreviewContext();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      id: "live-preview-toolbar"
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform
  } = useDraggable(t0);
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [baseClass, `${baseClass}--draggable`];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = `${toolbarPosition.x}px`;
  const t3 = `${toolbarPosition.y}px`;
  let t4;
  if ($[2] !== attributes || $[3] !== listeners || $[4] !== props || $[5] !== setNodeRef || $[6] !== t2 || $[7] !== t3 || $[8] !== transform) {
    t4 = _jsxs("div", {
      className: t1.join(" "),
      style: {
        left: t2,
        top: t3,
        ...(transform ? {
          transform: transform ? `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)` : undefined
        } : {})
      },
      children: [_jsx("button", {
        ...listeners,
        ...attributes,
        className: `${baseClass}__drag-handle`,
        ref: setNodeRef,
        type: "button",
        children: _jsx(DragHandleIcon, {})
      }), _jsx(ToolbarControls, {
        ...props
      })]
    });
    $[2] = attributes;
    $[3] = listeners;
    $[4] = props;
    $[5] = setNodeRef;
    $[6] = t2;
    $[7] = t3;
    $[8] = transform;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
};
const StaticToolbar = props => {
  return /*#__PURE__*/_jsx("div", {
    className: [baseClass, `${baseClass}--static`].join(' '),
    children: /*#__PURE__*/_jsx(ToolbarControls, {
      ...props
    })
  });
};
export const LivePreviewToolbar = props => {
  const {
    draggable
  } = props;
  if (draggable) {
    return /*#__PURE__*/_jsx(DraggableToolbar, {
      ...props
    });
  }
  return /*#__PURE__*/_jsx(StaticToolbar, {
    ...props
  });
};
//# sourceMappingURL=index.js.map