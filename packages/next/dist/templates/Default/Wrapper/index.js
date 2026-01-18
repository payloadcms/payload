'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useNav } from '@payloadcms/ui';
import React from 'react';
export const Wrapper = props => {
  const $ = _c(9);
  const {
    baseClass,
    children,
    className
  } = props;
  const {
    hydrated,
    navOpen,
    shouldAnimate
  } = useNav();
  const t0 = navOpen && `${baseClass}--nav-open`;
  const t1 = shouldAnimate && `${baseClass}--nav-animate`;
  const t2 = hydrated && `${baseClass}--nav-hydrated`;
  let t3;
  if ($[0] !== baseClass || $[1] !== className || $[2] !== t0 || $[3] !== t1 || $[4] !== t2) {
    t3 = [baseClass, className, t0, t1, t2].filter(Boolean);
    $[0] = baseClass;
    $[1] = className;
    $[2] = t0;
    $[3] = t1;
    $[4] = t2;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const t4 = t3.join(" ");
  let t5;
  if ($[6] !== children || $[7] !== t4) {
    t5 = _jsx("div", {
      className: t4,
      children
    });
    $[6] = children;
    $[7] = t4;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  return t5;
};
//# sourceMappingURL=index.js.map