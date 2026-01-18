'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { ChevronIcon } from '../../icons/Chevron/index.js';
import { DragHandleIcon } from '../../icons/DragHandle/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
import { AnimateHeight } from '../AnimateHeight/index.js';
import { CollapsibleProvider, useCollapsible } from './provider.js';
const baseClass = 'collapsible';
export { CollapsibleProvider, useCollapsible };
export const Collapsible = t0 => {
  const $ = _c(25);
  const {
    actions,
    AfterCollapsible,
    children,
    className,
    collapsibleStyle: t1,
    disableHeaderToggle: t2,
    disableToggleIndicator: t3,
    dragHandleProps,
    header,
    initCollapsed,
    isCollapsed: collapsedFromProps,
    onToggle
  } = t0;
  const collapsibleStyle = t1 === undefined ? "default" : t1;
  const disableHeaderToggle = t2 === undefined ? false : t2;
  const disableToggleIndicator = t3 === undefined ? false : t3;
  const [collapsedLocal, setCollapsedLocal] = useState(Boolean(initCollapsed));
  const [hoveringToggle, setHoveringToggle] = useState(false);
  const {
    isWithinCollapsible
  } = useCollapsible();
  const {
    t
  } = useTranslation();
  const isCollapsed = typeof collapsedFromProps === "boolean" ? collapsedFromProps : collapsedLocal;
  let t4;
  if ($[0] !== isCollapsed || $[1] !== onToggle) {
    t4 = () => {
      if (typeof onToggle === "function") {
        onToggle(!isCollapsed);
      }
      setCollapsedLocal(!isCollapsed);
    };
    $[0] = isCollapsed;
    $[1] = onToggle;
    $[2] = t4;
  } else {
    t4 = $[2];
  }
  const toggleCollapsible = t4;
  const t5 = dragHandleProps && `${baseClass}--has-drag-handle`;
  const t6 = isCollapsed && `${baseClass}--collapsed`;
  const t7 = isWithinCollapsible && `${baseClass}--nested`;
  const t8 = hoveringToggle && !disableHeaderToggle && `${baseClass}--hovered`;
  const t9 = `${baseClass}--style-${collapsibleStyle}`;
  let t10;
  if ($[3] !== className || $[4] !== t5 || $[5] !== t6 || $[6] !== t7 || $[7] !== t8 || $[8] !== t9) {
    t10 = [baseClass, className, t5, t6, t7, t8, t9].filter(Boolean);
    $[3] = className;
    $[4] = t5;
    $[5] = t6;
    $[6] = t7;
    $[7] = t8;
    $[8] = t9;
    $[9] = t10;
  } else {
    t10 = $[9];
  }
  const t11 = t10.join(" ");
  const t12 = `${baseClass}__toggle-wrap${disableHeaderToggle ? " toggle-disabled" : ""}`;
  let t13;
  let t14;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t13 = () => setHoveringToggle(true);
    t14 = () => setHoveringToggle(false);
    $[10] = t13;
    $[11] = t14;
  } else {
    t13 = $[10];
    t14 = $[11];
  }
  let t15;
  if ($[12] !== AfterCollapsible || $[13] !== actions || $[14] !== children || $[15] !== disableHeaderToggle || $[16] !== disableToggleIndicator || $[17] !== dragHandleProps || $[18] !== header || $[19] !== isCollapsed || $[20] !== t || $[21] !== t11 || $[22] !== t12 || $[23] !== toggleCollapsible) {
    t15 = _jsx("div", {
      className: t11,
      children: _jsxs(CollapsibleProvider, {
        isCollapsed,
        toggle: toggleCollapsible,
        children: [_jsxs("div", {
          className: t12,
          onMouseEnter: t13,
          onMouseLeave: t14,
          children: [!disableHeaderToggle && _jsx("button", {
            className: [`${baseClass}__toggle`, `${baseClass}__toggle--${isCollapsed ? "collapsed" : "open"}`].filter(Boolean).join(" "),
            onClick: toggleCollapsible,
            type: "button",
            children: _jsx("span", {
              children: t("fields:toggleBlock")
            })
          }), dragHandleProps && _jsx("div", {
            className: `${baseClass}__drag`,
            ...dragHandleProps.attributes,
            ...dragHandleProps.listeners,
            children: _jsx(DragHandleIcon, {})
          }), header ? _jsx("div", {
            className: [`${baseClass}__header-wrap`, dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`].filter(Boolean).join(" "),
            children: header
          }) : null, _jsxs("div", {
            className: `${baseClass}__actions-wrap`,
            children: [actions ? _jsx("div", {
              className: `${baseClass}__actions`,
              children: actions
            }) : null, !disableToggleIndicator && _jsx("div", {
              className: `${baseClass}__indicator`,
              children: _jsx(ChevronIcon, {
                direction: !isCollapsed ? "up" : undefined
              })
            })]
          })]
        }), _jsx(AnimateHeight, {
          height: isCollapsed ? 0 : "auto",
          children: _jsx("div", {
            className: `${baseClass}__content`,
            children
          })
        }), AfterCollapsible]
      })
    });
    $[12] = AfterCollapsible;
    $[13] = actions;
    $[14] = children;
    $[15] = disableHeaderToggle;
    $[16] = disableToggleIndicator;
    $[17] = dragHandleProps;
    $[18] = header;
    $[19] = isCollapsed;
    $[20] = t;
    $[21] = t11;
    $[22] = t12;
    $[23] = toggleCollapsible;
    $[24] = t15;
  } else {
    t15 = $[24];
  }
  return t15;
};
//# sourceMappingURL=index.js.map