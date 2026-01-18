'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { Hamburger, useNav } from '@payloadcms/ui';
import React from 'react';
/**
 * @internal
 */
export const NavHamburger = t0 => {
  const $ = _c(6);
  const {
    baseClass
  } = t0;
  const {
    navOpen,
    setNavOpen
  } = useNav();
  const t1 = `${baseClass}__mobile-close`;
  let t2;
  if ($[0] !== setNavOpen) {
    t2 = () => {
      setNavOpen(false);
    };
    $[0] = setNavOpen;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const t3 = !navOpen ? -1 : undefined;
  let t4;
  if ($[2] !== t1 || $[3] !== t2 || $[4] !== t3) {
    t4 = _jsx("button", {
      className: t1,
      onClick: t2,
      tabIndex: t3,
      type: "button",
      children: _jsx(Hamburger, {
        isActive: true
      })
    });
    $[2] = t1;
    $[3] = t2;
    $[4] = t3;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
};
//# sourceMappingURL=index.js.map