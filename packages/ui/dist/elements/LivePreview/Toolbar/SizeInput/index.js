'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback, useEffect } from 'react';
import { useLivePreviewContext } from '../../../../providers/LivePreview/context.js';
import './index.scss';
const baseClass = 'toolbar-input';
export const PreviewFrameSizeInput = props => {
  const $ = _c(18);
  const {
    axis
  } = props;
  const {
    breakpoint,
    measuredDeviceSize,
    setBreakpoint,
    setSize,
    size,
    zoom
  } = useLivePreviewContext();
  const [internalState, setInternalState] = React.useState((axis === "x" ? measuredDeviceSize?.width : measuredDeviceSize?.height) || 0);
  let t0;
  if ($[0] !== axis || $[1] !== measuredDeviceSize?.height || $[2] !== measuredDeviceSize?.width || $[3] !== setBreakpoint || $[4] !== setSize || $[5] !== zoom) {
    t0 = e => {
      let newValue = Number(e.target.value);
      if (newValue < 0) {
        newValue = 0;
      }
      setInternalState(newValue);
      setBreakpoint("custom");
      setSize({
        type: "reset",
        value: {
          height: axis === "y" ? newValue : Number(measuredDeviceSize?.height.toFixed(0)) * zoom,
          width: axis === "x" ? newValue : Number(measuredDeviceSize?.width.toFixed(0)) * zoom
        }
      });
    };
    $[0] = axis;
    $[1] = measuredDeviceSize?.height;
    $[2] = measuredDeviceSize?.width;
    $[3] = setBreakpoint;
    $[4] = setSize;
    $[5] = zoom;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  const handleChange = t0;
  let t1;
  let t2;
  if ($[7] !== axis || $[8] !== breakpoint || $[9] !== measuredDeviceSize || $[10] !== size || $[11] !== zoom) {
    t1 = () => {
      if (breakpoint === "responsive" && measuredDeviceSize) {
        if (axis === "x") {
          setInternalState(Number(measuredDeviceSize.width.toFixed(0)) * zoom);
        } else {
          setInternalState(Number(measuredDeviceSize.height.toFixed(0)) * zoom);
        }
      }
      if (breakpoint !== "responsive" && size) {
        setInternalState(axis === "x" ? size.width : size.height);
      }
    };
    t2 = [breakpoint, axis, measuredDeviceSize, size, zoom];
    $[7] = axis;
    $[8] = breakpoint;
    $[9] = measuredDeviceSize;
    $[10] = size;
    $[11] = zoom;
    $[12] = t1;
    $[13] = t2;
  } else {
    t1 = $[12];
    t2 = $[13];
  }
  useEffect(t1, t2);
  const t3 = axis === "x" ? "live-preview-width" : "live-preview-height";
  const t4 = internalState || 0;
  let t5;
  if ($[14] !== handleChange || $[15] !== t3 || $[16] !== t4) {
    t5 = _jsx("input", {
      className: baseClass,
      min: 0,
      name: t3,
      onChange: handleChange,
      step: 1,
      type: "number",
      value: t4
    });
    $[14] = handleChange;
    $[15] = t3;
    $[16] = t4;
    $[17] = t5;
  } else {
    t5 = $[17];
  }
  return t5;
};
//# sourceMappingURL=index.js.map