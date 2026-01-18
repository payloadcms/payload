'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { ChevronIcon } from '../../icons/Chevron/index.js';
import { usePreferences } from '../../providers/Preferences/index.js';
import './index.scss';
import { AnimateHeight } from '../AnimateHeight/index.js';
import { useNav } from '../Nav/context.js';
const baseClass = 'nav-group';
const preferencesKey = 'nav';
export const NavGroup = t0 => {
  const $ = _c(21);
  const {
    children,
    isOpen: isOpenFromProps,
    label
  } = t0;
  const [collapsed, setCollapsed] = useState(typeof isOpenFromProps !== "undefined" ? !isOpenFromProps : false);
  const [animate, setAnimate] = useState(false);
  const {
    setPreference
  } = usePreferences();
  const {
    navOpen
  } = useNav();
  if (label) {
    let t1;
    if ($[0] !== collapsed || $[1] !== label || $[2] !== setPreference) {
      t1 = () => {
        setAnimate(true);
        const newGroupPrefs = {};
        if (!newGroupPrefs?.[label]) {
          newGroupPrefs[label] = {
            open: Boolean(collapsed)
          };
        } else {
          newGroupPrefs[label].open = Boolean(collapsed);
        }
        setPreference(preferencesKey, {
          groups: newGroupPrefs
        }, true);
        setCollapsed(!collapsed);
      };
      $[0] = collapsed;
      $[1] = label;
      $[2] = setPreference;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    const toggleCollapsed = t1;
    const t2 = `${label}`;
    const t3 = collapsed && `${baseClass}--collapsed`;
    let t4;
    if ($[4] !== t2 || $[5] !== t3) {
      t4 = [`${baseClass}`, t2, t3].filter(Boolean);
      $[4] = t2;
      $[5] = t3;
      $[6] = t4;
    } else {
      t4 = $[6];
    }
    const t5 = t4.join(" ");
    const t6 = `nav-group-${label}`;
    const t7 = `${baseClass}__toggle--${collapsed ? "collapsed" : "open"}`;
    let t8;
    if ($[7] !== t7) {
      t8 = [`${baseClass}__toggle`, t7].filter(Boolean);
      $[7] = t7;
      $[8] = t8;
    } else {
      t8 = $[8];
    }
    const t9 = t8.join(" ");
    const t10 = !navOpen ? -1 : 0;
    let t11;
    if ($[9] !== animate || $[10] !== children || $[11] !== collapsed || $[12] !== label || $[13] !== t10 || $[14] !== t5 || $[15] !== t6 || $[16] !== t9 || $[17] !== toggleCollapsed) {
      t11 = _jsxs("div", {
        className: t5,
        id: t6,
        children: [_jsxs("button", {
          className: t9,
          onClick: toggleCollapsed,
          tabIndex: t10,
          type: "button",
          children: [_jsx("div", {
            className: `${baseClass}__label`,
            children: label
          }), _jsx("div", {
            className: `${baseClass}__indicator`,
            children: _jsx(ChevronIcon, {
              className: `${baseClass}__indicator`,
              direction: !collapsed ? "up" : undefined
            })
          })]
        }), _jsx(AnimateHeight, {
          duration: animate ? 200 : 0,
          height: collapsed ? 0 : "auto",
          children: _jsx("div", {
            className: `${baseClass}__content`,
            children
          })
        })]
      });
      $[9] = animate;
      $[10] = children;
      $[11] = collapsed;
      $[12] = label;
      $[13] = t10;
      $[14] = t5;
      $[15] = t6;
      $[16] = t9;
      $[17] = toggleCollapsed;
      $[18] = t11;
    } else {
      t11 = $[18];
    }
    return t11;
  }
  let t1;
  if ($[19] !== children) {
    t1 = _jsx(React.Fragment, {
      children
    });
    $[19] = children;
    $[20] = t1;
  } else {
    t1 = $[20];
  }
  return t1;
};
//# sourceMappingURL=index.js.map