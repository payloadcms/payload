import { jsx as _jsx } from "react/jsx-runtime";
import { useDraggable } from '@dnd-kit/core';
import React, { useId, useRef } from 'react';
import './index.scss';
const baseClass = 'draggable-with-click';
export const DraggableWithClick = ({
  as = 'div',
  children,
  className,
  disabled = false,
  onClick,
  onKeyDown,
  ref,
  thresholdPixels = 3
}) => {
  const id = useId();
  const {
    attributes,
    listeners,
    setNodeRef
  } = useDraggable({
    id,
    disabled
  });
  const initialPos = useRef({
    x: 0,
    y: 0
  });
  const isDragging = useRef(false);
  const handlePointerDown = e => {
    initialPos.current = {
      x: e.clientX,
      y: e.clientY
    };
    isDragging.current = false;
    const handlePointerMove = moveEvent => {
      const deltaX = Math.abs(moveEvent.clientX - initialPos.current.x);
      const deltaY = Math.abs(moveEvent.clientY - initialPos.current.y);
      if (deltaX > thresholdPixels || deltaY > thresholdPixels) {
        isDragging.current = true;
        if (listeners?.onPointerDown) {
          listeners.onPointerDown(e);
          // when the user starts dragging
          // - call the click handler
          // - remove the pointermove listener
          onClick(moveEvent);
        }
        window.removeEventListener('pointermove', handlePointerMove);
      }
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    const handlePointerUp = upEvent => {
      cleanup();
      if (!isDragging.current) {
        // if the user did not drag the element
        // - call the click handler
        onClick(upEvent);
      }
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  const Component = as || 'div';
  return /*#__PURE__*/_jsx(Component, {
    role: "button",
    tabIndex: 0,
    ...attributes,
    className: [baseClass, className, disabled ? `${baseClass}--disabled` : ''].filter(Boolean).join(' '),
    onKeyDown: disabled ? undefined : onKeyDown,
    onPointerDown: disabled ? undefined : onClick ? handlePointerDown : undefined,
    ref: node => {
      if (disabled) {
        return;
      }
      setNodeRef(node);
      if (ref) {
        ref.current = node;
      }
    },
    children: children
  });
};
//# sourceMappingURL=index.js.map