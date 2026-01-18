'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js';
export const DeviceContainer = props => {
  const $ = _c(6);
  const {
    children
  } = props;
  const {
    breakpoint,
    breakpoints,
    size,
    zoom
  } = useLivePreviewContext();
  const foundBreakpoint = breakpoint && breakpoints?.find(bp => bp.name === breakpoint);
  let x = "0";
  let margin = "0";
  if (foundBreakpoint && breakpoint !== "responsive") {
    x = "-50%";
    if (typeof zoom === "number" && typeof size.width === "number" && typeof size.height === "number") {
      const scaledWidth = size.width / zoom;
      const difference = scaledWidth - size.width;
      x = `${difference / 2}px`;
      margin = "0 auto";
    }
  }
  const t0 = foundBreakpoint && foundBreakpoint?.name !== "responsive" ? `${size?.height / (typeof zoom === "number" ? zoom : 1)}px` : typeof zoom === "number" ? `${100 / zoom}%` : "100%";
  const t1 = `translate3d(${x}, 0, 0)`;
  const t2 = foundBreakpoint && foundBreakpoint?.name !== "responsive" ? `${size?.width / (typeof zoom === "number" ? zoom : 1)}px` : typeof zoom === "number" ? `${100 / zoom}%` : "100%";
  let t3;
  if ($[0] !== children || $[1] !== margin || $[2] !== t0 || $[3] !== t1 || $[4] !== t2) {
    t3 = _jsx("div", {
      style: {
        height: t0,
        margin,
        transform: t1,
        width: t2
      },
      children
    });
    $[0] = children;
    $[1] = margin;
    $[2] = t0;
    $[3] = t1;
    $[4] = t2;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
};
//# sourceMappingURL=index.js.map