'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ChevronIcon } from '../../icons/Chevron/index.js';
import { CloseMenuIcon } from '../../icons/CloseMenu/index.js';
import { MenuIcon } from '../../icons/Menu/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'hamburger';
export const Hamburger = props => {
  const $ = _c(4);
  const {
    t
  } = useTranslation();
  const {
    closeIcon: t0,
    isActive: t1
  } = props;
  const closeIcon = t0 === undefined ? "x" : t0;
  const isActive = t1 === undefined ? false : t1;
  let t2;
  if ($[0] !== closeIcon || $[1] !== isActive || $[2] !== t) {
    t2 = _jsxs("div", {
      className: baseClass,
      children: [!isActive && _jsx("div", {
        "aria-label": t("general:open"),
        className: `${baseClass}__open-icon`,
        title: t("general:open"),
        children: _jsx(MenuIcon, {})
      }), isActive && _jsxs("div", {
        "aria-label": closeIcon === "collapse" ? t("general:collapse") : t("general:close"),
        className: `${baseClass}__close-icon`,
        title: closeIcon === "collapse" ? t("general:collapse") : t("general:close"),
        children: [closeIcon === "x" && _jsx(CloseMenuIcon, {}), closeIcon === "collapse" && _jsx(ChevronIcon, {
          direction: "left"
        })]
      })]
    });
    $[0] = closeIcon;
    $[1] = isActive;
    $[2] = t;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
};
//# sourceMappingURL=index.js.map