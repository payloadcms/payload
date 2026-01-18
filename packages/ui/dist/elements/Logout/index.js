'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { formatAdminURL } from 'payload/shared';
import React from 'react';
import { LogOutIcon } from '../../icons/LogOut/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Link } from '../Link/index.js';
const baseClass = 'nav';
export const Logout = t0 => {
  const $ = _c(5);
  const {
    tabIndex: t1
  } = t0;
  const tabIndex = t1 === undefined ? 0 : t1;
  const {
    t
  } = useTranslation();
  const {
    config
  } = useConfig();
  const {
    admin: t2,
    routes: t3
  } = config;
  const {
    routes: t4
  } = t2;
  const {
    logout: logoutRoute
  } = t4;
  const {
    admin: adminRoute
  } = t3;
  let t5;
  if ($[0] !== adminRoute || $[1] !== logoutRoute || $[2] !== t || $[3] !== tabIndex) {
    t5 = _jsx(Link, {
      "aria-label": t("authentication:logOut"),
      className: `${baseClass}__log-out`,
      href: formatAdminURL({
        adminRoute,
        path: logoutRoute
      }),
      prefetch: false,
      tabIndex,
      title: t("authentication:logOut"),
      children: _jsx(LogOutIcon, {})
    });
    $[0] = adminRoute;
    $[1] = logoutRoute;
    $[2] = t;
    $[3] = tabIndex;
    $[4] = t5;
  } else {
    t5 = $[4];
  }
  return t5;
};
//# sourceMappingURL=index.js.map