'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { GearIcon, Popup, useTranslation } from '@payloadcms/ui';
import React, { Fragment } from 'react';
const baseClass = 'settings-menu-button';
export const SettingsMenuButton = t0 => {
  const $ = _c(3);
  const {
    settingsMenu
  } = t0;
  const {
    t
  } = useTranslation();
  if (!settingsMenu || settingsMenu.length === 0) {
    return null;
  }
  let t1;
  if ($[0] !== settingsMenu || $[1] !== t) {
    t1 = _jsx(Popup, {
      button: _jsx(GearIcon, {
        ariaLabel: t("general:menu")
      }),
      className: baseClass,
      horizontalAlign: "left",
      id: "settings-menu",
      size: "small",
      verticalAlign: "bottom",
      children: settingsMenu.map(_temp)
    });
    $[0] = settingsMenu;
    $[1] = t;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
function _temp(item, i) {
  return _jsx(Fragment, {
    children: item
  }, `settings-menu-item-${i}`);
}
//# sourceMappingURL=index.js.map