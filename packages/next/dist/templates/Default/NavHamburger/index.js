'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { Hamburger, useNav } from '@payloadcms/ui';
import React from 'react';
export const NavHamburger = () => {
  const $ = _c(2);
  const {
    navOpen
  } = useNav();
  let t0;
  if ($[0] !== navOpen) {
    t0 = _jsx(Hamburger, {
      closeIcon: "collapse",
      isActive: navOpen
    });
    $[0] = navOpen;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
};
//# sourceMappingURL=index.js.map