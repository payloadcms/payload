'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { PlusIcon } from '../../icons/Plus/index.js';
import { XIcon } from '../../icons/X/index.js';
import { DraggableSortable } from '../DraggableSortable/index.js';
import { Pill } from '../Pill/index.js';
import './index.scss';
const baseClass = 'pill-selector';
/**
 * Displays a wrappable list of pills that can be selected or deselected.
 * If `draggable` is true, the pills can be reordered by dragging.
 */
export const PillSelector = ({
  draggable,
  onClick,
  pills
}) => {
  // IMPORTANT: Do NOT wrap DraggableSortable in a dynamic component function using useMemo.
  // BAD: useMemo(() => ({ children }) => <DraggableSortable>...</DraggableSortable>, [deps])
  // This creates a new function reference on each recomputation, causing React to treat it as a
  // different component type, triggering unmount/mount cycles instead of just updating props.
  // GOOD: Use conditional rendering directly: draggable ? <DraggableSortable /> : <div />
  const pillElements = React.useMemo(() => {
    return pills.map((pill, i) => {
      return /*#__PURE__*/_jsx(Pill, {
        alignIcon: "left",
        "aria-checked": pill.selected,
        className: [`${baseClass}__pill`, pill.selected && `${baseClass}__pill--selected`].filter(Boolean).join(' '),
        draggable: Boolean(draggable),
        icon: pill.selected ? /*#__PURE__*/_jsx(XIcon, {}) : /*#__PURE__*/_jsx(PlusIcon, {}),
        id: pill.name,
        onClick: () => {
          if (onClick) {
            void onClick({
              pill
            });
          }
        },
        size: "small",
        children: pill.Label ?? /*#__PURE__*/_jsx("span", {
          className: `${baseClass}__pill-label`,
          children: pill.name
        })
      }, pill.key ?? `${pill.name}-${i}`);
    });
  }, [pills, onClick, draggable]);
  if (draggable) {
    return /*#__PURE__*/_jsx(DraggableSortable, {
      className: baseClass,
      ids: pills.map(pill_0 => pill_0.name),
      onDragEnd: ({
        moveFromIndex,
        moveToIndex
      }) => {
        draggable.onDragEnd({
          moveFromIndex,
          moveToIndex
        });
      },
      children: pillElements
    });
  }
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: pillElements
  });
};
//# sourceMappingURL=index.js.map