'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useDelay } from '../../hooks/useDelay.js';
import './index.scss';
export const ShimmerEffect = ({
  animationDelay = '0ms',
  className,
  disableInlineStyles = false,
  height = '60px',
  width = '100%'
}) => {
  return /*#__PURE__*/_jsx("div", {
    className: ['shimmer-effect', className].filter(Boolean).join(' '),
    style: {
      height: !disableInlineStyles && (typeof height === 'number' ? `${height}px` : height),
      width: !disableInlineStyles && (typeof width === 'number' ? `${width}px` : width)
    },
    children: /*#__PURE__*/_jsx("div", {
      className: "shimmer-effect__shine",
      style: {
        animationDelay
      }
    })
  });
};
export const StaggeredShimmers = t0 => {
  const $ = _c(9);
  const {
    className,
    count,
    height,
    renderDelay: t1,
    shimmerDelay: t2,
    shimmerItemClassName,
    width
  } = t0;
  const renderDelay = t1 === undefined ? 500 : t1;
  const shimmerDelay = t2 === undefined ? 25 : t2;
  const shimmerDelayToPass = typeof shimmerDelay === "number" ? `${shimmerDelay}ms` : shimmerDelay;
  const [hasDelayed] = useDelay(renderDelay, true);
  if (!hasDelayed) {
    return null;
  }
  let t3;
  if ($[0] !== count) {
    t3 = [...Array(count)];
    $[0] = count;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  let t4;
  if ($[2] !== className || $[3] !== height || $[4] !== shimmerDelayToPass || $[5] !== shimmerItemClassName || $[6] !== t3 || $[7] !== width) {
    t4 = _jsx("div", {
      className,
      children: t3.map((_, i) => _jsx("div", {
        className: shimmerItemClassName,
        children: _jsx(ShimmerEffect, {
          animationDelay: `calc(${i} * ${shimmerDelayToPass})`,
          height,
          width
        })
      }, i))
    });
    $[2] = className;
    $[3] = height;
    $[4] = shimmerDelayToPass;
    $[5] = shimmerItemClassName;
    $[6] = t3;
    $[7] = width;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
};
//# sourceMappingURL=index.js.map