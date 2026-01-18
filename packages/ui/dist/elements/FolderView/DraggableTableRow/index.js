'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import { DraggableWithClick } from '../DraggableWithClick/index.js';
import { HiddenCell, TableCell } from '../SimpleTable/index.js';
import './index.scss';
const baseClass = 'draggable-table-row';
export function DraggableTableRow({
  id,
  columns,
  disabled = false,
  dragData,
  isDroppable: _isDroppable,
  isFocused,
  isSelected,
  isSelecting,
  itemKey,
  onClick,
  onKeyDown
}) {
  const isDroppable = !disabled && _isDroppable && !isSelected;
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id,
    data: dragData,
    disabled: !isDroppable
  });
  const ref = React.useRef(null);
  React.useEffect(() => {
    const copyOfRef = ref.current;
    if (isFocused && ref.current) {
      ref.current.focus();
    } else if (!isFocused && ref.current) {
      ref.current.blur();
    }
    return () => {
      if (copyOfRef) {
        copyOfRef.blur();
      }
    };
  }, [isFocused]);
  return /*#__PURE__*/_jsxs(DraggableWithClick, {
    as: "tr",
    className: [baseClass, isSelected && `${baseClass}--selected`, isSelecting && `${baseClass}--selecting`, disabled && `${baseClass}--disabled`, isFocused && `${baseClass}--focused`, isOver && `${baseClass}--over`].filter(Boolean).join(' '),
    onClick: onClick,
    onKeyDown: onKeyDown,
    ref: ref,
    children: [columns.map((col, i) => /*#__PURE__*/_jsx(TableCell, {
      className: [`${baseClass}__cell-content`, i === 0 && `${baseClass}__first-td`, i === columns.length - 1 && `${baseClass}__last-td`].filter(Boolean).join(' '),
      children: col
    }, `${itemKey}-${i}`)), isDroppable ? /*#__PURE__*/_jsx(HiddenCell, {
      children: /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__drop-area`,
        ref: setNodeRef
      })
    }) : null]
  }, itemKey);
}
//# sourceMappingURL=index.js.map