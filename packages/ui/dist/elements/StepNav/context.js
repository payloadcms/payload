'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useState } from 'react';
export const useStepNav = () => use(Context);
export const Context = /*#__PURE__*/createContext({
  setStepNav: () => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('StepNavProvider is missing; `setStepNav` is a no-op.');
    }
  },
  stepNav: []
});
export const StepNavProvider = t0 => {
  const $ = _c(4);
  const {
    children
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [stepNav, setStepNav] = useState(t1);
  let t2;
  if ($[1] !== children || $[2] !== stepNav) {
    t2 = _jsx(Context, {
      value: {
        setStepNav,
        stepNav
      },
      children
    });
    $[1] = children;
    $[2] = stepNav;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
};
//# sourceMappingURL=context.js.map