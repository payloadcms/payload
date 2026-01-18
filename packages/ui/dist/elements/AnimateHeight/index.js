'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { usePatchAnimateHeight } from './usePatchAnimateHeight.js';
import './index.scss';
export const AnimateHeight = ({
  id,
  children,
  className,
  duration = 300,
  height
}) => {
  const [open, setOpen] = React.useState(() => Boolean(height));
  const prevIsOpen = useRef(open);
  const [childrenDisplay, setChildrenDisplay] = React.useState(() => open ? '' : 'none');
  const [parentOverflow, setParentOverflow] = React.useState(() => open ? '' : 'hidden');
  const [isAnimating, setIsAnimating] = React.useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  useEffect(() => {
    let displayTimer;
    let overflowTimer;
    const newIsOpen = Boolean(height);
    const hasChanged = prevIsOpen.current !== newIsOpen;
    prevIsOpen.current = newIsOpen;
    if (hasChanged) {
      setIsAnimating(true);
      setParentOverflow('hidden');
      if (newIsOpen) {
        setChildrenDisplay('');
      } else {
        // `display: none` once closed
        displayTimer = window.setTimeout(() => {
          setChildrenDisplay('none');
        }, duration);
      }
      setOpen(newIsOpen);
      // reset overflow once open
      overflowTimer = window.setTimeout(() => {
        setParentOverflow('');
        setIsAnimating(false);
      }, duration);
    }
    return () => {
      if (displayTimer) {
        clearTimeout(displayTimer);
      }
      if (overflowTimer) {
        clearTimeout(overflowTimer);
      }
    };
  }, [height, duration]);
  usePatchAnimateHeight({
    containerRef,
    contentRef,
    duration,
    open
  });
  return /*#__PURE__*/_jsx("div", {
    "aria-hidden": !open,
    className: [className, 'rah-static', open && height === 'auto' && 'rah-static--height-auto', isAnimating && `rah-animating--${open ? 'down' : 'up'}`, isAnimating && height === 'auto' && `rah-animating--to-height-auto`].filter(Boolean).join(' '),
    id: id,
    ref: containerRef,
    style: {
      overflow: parentOverflow,
      transition: `height ${duration}ms ease`
    },
    children: /*#__PURE__*/_jsx("div", {
      ref: contentRef,
      ...(childrenDisplay ? {
        style: {
          display: childrenDisplay
        }
      } : {}),
      children: children
    })
  });
};
//# sourceMappingURL=index.js.map