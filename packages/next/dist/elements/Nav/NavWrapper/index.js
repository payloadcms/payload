'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useNav } from '@payloadcms/ui';
import React from 'react';
/**
 * @internal
 */
export const NavWrapper = props => {
  const $ = _c(11);
  const {
    baseClass,
    children
  } = props;
  const {
    hydrated,
    navOpen,
    navRef,
    shouldAnimate
  } = useNav();
  const t0 = navOpen && `${baseClass}--nav-open`;
  const t1 = shouldAnimate && `${baseClass}--nav-animate`;
  const t2 = hydrated && `${baseClass}--nav-hydrated`;
  let t3;
  if ($[0] !== baseClass || $[1] !== t0 || $[2] !== t1 || $[3] !== t2) {
    t3 = [baseClass, t0, t1, t2].filter(Boolean);
    $[0] = baseClass;
    $[1] = t0;
    $[2] = t1;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const t4 = t3.join(" ");
  const t5 = !navOpen ? true : undefined;
  const t6 = `${baseClass}__scroll`;
  let t7;
  if ($[5] !== children || $[6] !== navRef || $[7] !== t4 || $[8] !== t5 || $[9] !== t6) {
    t7 = _jsx("aside", {
      className: t4,
      inert: t5,
      children: _jsx("div", {
        className: t6,
        ref: navRef,
        children
      })
    });
    $[5] = children;
    $[6] = navRef;
    $[7] = t4;
    $[8] = t5;
    $[9] = t6;
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  return t7;
};
//# sourceMappingURL=index.js.map