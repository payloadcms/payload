'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use } from 'react';
export const EditDepthContext = /*#__PURE__*/createContext(0);
export const EditDepthProvider = t0 => {
  const $ = _c(3);
  const {
    children
  } = t0;
  const parentDepth = useEditDepth();
  const depth = parentDepth + 1;
  let t1;
  if ($[0] !== children || $[1] !== depth) {
    t1 = _jsx(EditDepthContext, {
      value: depth,
      children
    });
    $[0] = children;
    $[1] = depth;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
export const useEditDepth = () => use(EditDepthContext);
//# sourceMappingURL=index.js.map