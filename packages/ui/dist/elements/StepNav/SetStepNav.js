'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect } from 'react';
import { useStepNav } from './context.js';
export const SetStepNav = t0 => {
  const $ = _c(4);
  const {
    nav
  } = t0;
  const {
    setStepNav
  } = useStepNav();
  let t1;
  let t2;
  if ($[0] !== nav || $[1] !== setStepNav) {
    t1 = () => {
      setStepNav(nav);
    };
    t2 = [setStepNav, nav];
    $[0] = nav;
    $[1] = setStepNav;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  return null;
};
//# sourceMappingURL=SetStepNav.js.map