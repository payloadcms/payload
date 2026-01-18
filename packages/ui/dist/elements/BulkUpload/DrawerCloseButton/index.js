'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { XIcon } from '../../../icons/X/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'drawer-close-button';
export function DrawerCloseButton(t0) {
  const $ = _c(3);
  const {
    onClick
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== onClick || $[1] !== t) {
    t1 = _jsx("button", {
      "aria-label": t("general:close"),
      className: baseClass,
      onClick,
      type: "button",
      children: _jsx(XIcon, {})
    });
    $[0] = onClick;
    $[1] = t;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}
//# sourceMappingURL=index.js.map