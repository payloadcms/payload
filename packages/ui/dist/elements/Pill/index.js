'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react'; // TODO: abstract this out to support all routers
import { Link } from '../Link/index.js';
import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable/index.js';
import './index.scss';
const baseClass = 'pill';
const DraggablePill = props => {
  const $ = _c(12);
  const {
    id,
    className
  } = props;
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
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform
  } = useDraggableSortable(t0);
  const t1 = isDragging && `${baseClass}--is-dragging`;
  let t2;
  if ($[2] !== className || $[3] !== t1) {
    t2 = [t1, className].filter(Boolean);
    $[2] = className;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const t3 = t2.join(" ");
  let t4;
  if ($[5] !== attributes || $[6] !== listeners || $[7] !== props || $[8] !== setNodeRef || $[9] !== t3 || $[10] !== transform) {
    t4 = _jsx(StaticPill, {
      ...props,
      className: t3,
      elementProps: {
        ...listeners,
        ...attributes,
        ref: setNodeRef,
        style: {
          transform
        }
      }
    });
    $[5] = attributes;
    $[6] = listeners;
    $[7] = props;
    $[8] = setNodeRef;
    $[9] = t3;
    $[10] = transform;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  return t4;
};
const StaticPill = props => {
  const {
    id,
    alignIcon = 'right',
    'aria-checked': ariaChecked,
    'aria-controls': ariaControls,
    'aria-expanded': ariaExpanded,
    'aria-label': ariaLabel,
    children,
    className,
    draggable,
    elementProps,
    icon,
    onClick,
    pillStyle = 'light',
    rounded,
    size = 'medium',
    to
  } = props;
  const classes = [baseClass, `${baseClass}--style-${pillStyle}`, `${baseClass}--size-${size}`, className && className, to && `${baseClass}--has-link`, (to || onClick) && `${baseClass}--has-action`, icon && `${baseClass}--has-icon`, icon && `${baseClass}--align-icon-${alignIcon}`, draggable && `${baseClass}--draggable`, rounded && `${baseClass}--rounded`].filter(Boolean).join(' ');
  let Element = 'div';
  if (onClick && !to) {
    Element = 'button';
  }
  if (to) {
    Element = Link;
  }
  return /*#__PURE__*/_jsxs(Element, {
    ...elementProps,
    "aria-checked": ariaChecked,
    "aria-controls": ariaControls,
    "aria-expanded": ariaExpanded,
    "aria-label": ariaLabel,
    className: classes,
    href: to || null,
    id: id,
    onClick: onClick,
    type: Element === 'button' ? 'button' : undefined,
    children: [/*#__PURE__*/_jsx("span", {
      className: `${baseClass}__label`,
      children: children
    }), Boolean(icon) && /*#__PURE__*/_jsx("span", {
      className: `${baseClass}__icon`,
      children: icon
    })]
  });
};
export const Pill = props => {
  const {
    draggable
  } = props;
  if (draggable) {
    return /*#__PURE__*/_jsx(DraggablePill, {
      ...props
    });
  }
  return /*#__PURE__*/_jsx(StaticPill, {
    ...props
  });
};
//# sourceMappingURL=index.js.map