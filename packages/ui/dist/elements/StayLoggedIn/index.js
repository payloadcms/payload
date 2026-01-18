'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback } from 'react';
import { useAuth } from '../../providers/Auth/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
export const stayLoggedInModalSlug = 'stay-logged-in';
export const StayLoggedInModal = () => {
  const $ = _c(11);
  const {
    refreshCookie
  } = useAuth();
  const router = useRouter();
  const {
    config
  } = useConfig();
  const {
    admin: t0,
    routes: t1
  } = config;
  const {
    routes: t2
  } = t0;
  const {
    logout: logoutRoute
  } = t2;
  const {
    admin: adminRoute
  } = t1;
  const {
    t
  } = useTranslation();
  const {
    startRouteTransition
  } = useRouteTransition();
  let t3;
  if ($[0] !== adminRoute || $[1] !== logoutRoute || $[2] !== router || $[3] !== startRouteTransition) {
    t3 = () => startRouteTransition(() => router.push(formatAdminURL({
      adminRoute,
      path: logoutRoute
    })));
    $[0] = adminRoute;
    $[1] = logoutRoute;
    $[2] = router;
    $[3] = startRouteTransition;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const onConfirm = t3;
  let t4;
  if ($[5] !== refreshCookie) {
    t4 = () => {
      refreshCookie();
    };
    $[5] = refreshCookie;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  const onCancel = t4;
  let t5;
  if ($[7] !== onCancel || $[8] !== onConfirm || $[9] !== t) {
    t5 = _jsx(ConfirmationModal, {
      body: t("authentication:youAreInactive"),
      cancelLabel: t("authentication:stayLoggedIn"),
      confirmLabel: t("authentication:logOut"),
      heading: t("authentication:stayLoggedIn"),
      modalSlug: stayLoggedInModalSlug,
      onCancel,
      onConfirm
    });
    $[7] = onCancel;
    $[8] = onConfirm;
    $[9] = t;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  return t5;
};
//# sourceMappingURL=index.js.map