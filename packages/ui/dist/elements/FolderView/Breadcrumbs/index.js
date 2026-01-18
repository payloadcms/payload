'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import { ChevronIcon } from '../../../icons/Chevron/index.js';
import './index.scss';
const baseClass = 'folderBreadcrumbs';
export function FolderBreadcrumbs({
  breadcrumbs,
  className
}) {
  return /*#__PURE__*/_jsx("div", {
    className: `${baseClass} ${className || ''}`.trim(),
    children: breadcrumbs?.map((crumb, index) => /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__crumb`,
      children: [crumb.onClick ? /*#__PURE__*/_jsx(DroppableBreadcrumb, {
        className: `${baseClass}__crumb-item`,
        id: crumb.id,
        onClick: crumb.onClick,
        children: crumb.name
      }) : crumb.name, breadcrumbs.length > 0 && index !== breadcrumbs.length - 1 && /*#__PURE__*/_jsx(ChevronIcon, {
        className: `${baseClass}__crumb-chevron`,
        direction: "right"
      })]
    }, index))
  });
}
export function DroppableBreadcrumb(t0) {
  const $ = _c(13);
  const {
    id,
    children,
    className,
    onClick
  } = t0;
  const t1 = `folder-${id}`;
  let t2;
  if ($[0] !== id) {
    t2 = {
      id,
      type: "folder"
    };
    $[0] = id;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== t1 || $[3] !== t2) {
    t3 = {
      id: t1,
      data: t2
    };
    $[2] = t1;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const {
    isOver,
    setNodeRef
  } = useDroppable(t3);
  const t4 = isOver && "droppable-button--hover";
  let t5;
  if ($[5] !== className || $[6] !== t4) {
    t5 = ["droppable-button", className, t4].filter(Boolean);
    $[5] = className;
    $[6] = t4;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  const t6 = t5.join(" ");
  let t7;
  if ($[8] !== children || $[9] !== onClick || $[10] !== setNodeRef || $[11] !== t6) {
    t7 = _jsx("button", {
      className: t6,
      onClick,
      ref: setNodeRef,
      type: "button",
      children
    });
    $[8] = children;
    $[9] = onClick;
    $[10] = setNodeRef;
    $[11] = t6;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  return t7;
}
//# sourceMappingURL=index.js.map