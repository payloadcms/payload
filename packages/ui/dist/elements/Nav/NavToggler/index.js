'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useWindowInfo } from '@faceless-ui/window-info';
import React from 'react';
import { usePreferences } from '../../../providers/Preferences/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { useNav } from '../context.js';
import './index.scss';
const baseClass = 'nav-toggler';
export const NavToggler = props => {
  const $ = _c(15);
  const {
    id,
    children,
    className,
    tabIndex: t0
  } = props;
  const tabIndex = t0 === undefined ? 0 : t0;
  const {
    t
  } = useTranslation();
  const {
    setPreference
  } = usePreferences();
  const {
    navOpen,
    setNavOpen
  } = useNav();
  const {
    breakpoints: t1
  } = useWindowInfo();
  const {
    l: largeBreak
  } = t1;
  const t2 = `${navOpen ? t("general:close") : t("general:open")} ${t("general:menu")}`;
  const t3 = navOpen && `${baseClass}--is-open`;
  let t4;
  if ($[0] !== className || $[1] !== t3) {
    t4 = [baseClass, t3, className].filter(Boolean);
    $[0] = className;
    $[1] = t3;
    $[2] = t4;
  } else {
    t4 = $[2];
  }
  const t5 = t4.join(" ");
  let t6;
  if ($[3] !== largeBreak || $[4] !== navOpen || $[5] !== setNavOpen || $[6] !== setPreference) {
    t6 = async () => {
      setNavOpen(!navOpen);
      if (!largeBreak) {
        await setPreference("nav", {
          open: !navOpen
        }, true);
      }
    };
    $[3] = largeBreak;
    $[4] = navOpen;
    $[5] = setNavOpen;
    $[6] = setPreference;
    $[7] = t6;
  } else {
    t6 = $[7];
  }
  let t7;
  if ($[8] !== children || $[9] !== id || $[10] !== t2 || $[11] !== t5 || $[12] !== t6 || $[13] !== tabIndex) {
    t7 = _jsx("button", {
      "aria-label": t2,
      className: t5,
      id,
      onClick: t6,
      tabIndex,
      type: "button",
      children
    });
    $[8] = children;
    $[9] = id;
    $[10] = t2;
    $[11] = t5;
    $[12] = t6;
    $[13] = tabIndex;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  return t7;
};
//# sourceMappingURL=index.js.map