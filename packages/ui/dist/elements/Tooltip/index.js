'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useIntersect } from '../../hooks/useIntersect.js';
import './index.scss';
export const Tooltip = props => {
  const {
    alignCaret = 'center',
    boundingRef,
    children,
    className,
    delay = 350,
    position: positionFromProps,
    show: showFromProps = true,
    staticPositioning = false
  } = props;
  const [show, setShow] = React.useState(showFromProps);
  const [position, setPosition] = React.useState('top');
  const getTitleAttribute = content => typeof content === 'string' ? content : '';
  const [ref, intersectionEntry] = useIntersect({
    root: boundingRef?.current || null,
    rootMargin: '-145px 0px 0px 100px',
    threshold: 0
  }, staticPositioning);
  useEffect(() => {
    let timerID;
    // do not use the delay on transition-out
    if (delay && showFromProps) {
      timerID = setTimeout(() => {
        setShow(showFromProps);
      }, delay);
    } else {
      setShow(showFromProps);
    }
    return () => {
      if (timerID) {
        clearTimeout(timerID);
      }
    };
  }, [showFromProps, delay]);
  useEffect(() => {
    if (staticPositioning) {
      return;
    }
    setPosition(intersectionEntry?.isIntersecting ? 'top' : 'bottom');
  }, [intersectionEntry, staticPositioning]);
  // The first aside is always on top. The purpose of that is that it can reliably be used for the interaction observer (as it's not moving around), to calculate the position of the actual tooltip.
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [!staticPositioning && /*#__PURE__*/_jsx("aside", {
      "aria-hidden": "true",
      className: ['tooltip', className, `tooltip--caret-${alignCaret}`, 'tooltip--position-top'].filter(Boolean).join(' '),
      ref: ref,
      style: {
        opacity: '0'
      },
      children: /*#__PURE__*/_jsx("div", {
        className: "tooltip-content",
        children: children
      })
    }), /*#__PURE__*/_jsx("aside", {
      className: ['tooltip', className, show && 'tooltip--show', `tooltip--caret-${alignCaret}`, `tooltip--position-${positionFromProps || position}`].filter(Boolean).join(' '),
      title: getTitleAttribute(children),
      children: /*#__PURE__*/_jsx("div", {
        className: "tooltip-content",
        children: children
      })
    })]
  });
};
//# sourceMappingURL=index.js.map