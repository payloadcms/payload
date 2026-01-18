'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { usePathname } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
import { useAuth } from '../../providers/Auth/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { DefaultAccountIcon } from './Default/index.js';
import { GravatarAccountIcon } from './Gravatar/index.js';
export const Account = () => {
  const $ = _c(3);
  const {
    config: t0
  } = useConfig();
  const {
    admin: t1,
    routes: t2
  } = t0;
  const {
    avatar,
    routes: t3
  } = t1;
  const {
    account: accountRoute
  } = t3;
  const {
    admin: adminRoute
  } = t2;
  const {
    user
  } = useAuth();
  const pathname = usePathname();
  const isOnAccountPage = pathname === formatAdminURL({
    adminRoute,
    path: accountRoute
  });
  if (!user?.email || avatar === "default") {
    let t4;
    if ($[0] !== isOnAccountPage) {
      t4 = _jsx(DefaultAccountIcon, {
        active: isOnAccountPage
      });
      $[0] = isOnAccountPage;
      $[1] = t4;
    } else {
      t4 = $[1];
    }
    return t4;
  }
  if (avatar === "gravatar") {
    let t4;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t4 = _jsx(GravatarAccountIcon, {});
      $[2] = t4;
    } else {
      t4 = $[2];
    }
    return t4;
  }
};
//# sourceMappingURL=index.js.map