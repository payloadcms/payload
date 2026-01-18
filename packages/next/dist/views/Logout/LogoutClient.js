'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, LoadingOverlay, toast, useAuth, useConfig, useRouteTransition, useTranslation } from '@payloadcms/ui';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { useEffect } from 'react';
const baseClass = 'logout';
/**
 * This component should **just** be the inactivity route and do nothing with logging the user out.
 *
 * It currently handles too much, the auth provider should just log the user out and then
 * we could remove the useEffect in this file. So instead of the logout button
 * being an anchor link, it should be a button that calls `logOut` in the provider.
 *
 * This view is still useful if cookies attempt to refresh and fail, i.e. the user
 * is logged out due to inactivity.
 */
export const LogoutClient = props => {
  const $ = _c(23);
  const {
    adminRoute,
    inactivity,
    redirect
  } = props;
  const {
    logOut,
    user
  } = useAuth();
  useConfig();
  const {
    startRouteTransition
  } = useRouteTransition();
  user?.id;
  const isLoggedIn = Boolean(user?.id);
  const navigatingToLoginRef = React.useRef(false);
  let t0;
  if ($[0] !== adminRoute || $[1] !== inactivity || $[2] !== redirect) {
    t0 = () => formatAdminURL({
      adminRoute,
      path: `/login${inactivity && redirect && redirect.length > 0 ? `?redirect=${encodeURIComponent(redirect)}` : ""}`
    });
    $[0] = adminRoute;
    $[1] = inactivity;
    $[2] = redirect;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const [loginRoute] = React.useState(t0);
  const {
    t
  } = useTranslation();
  const router = useRouter();
  let t1;
  if ($[4] !== logOut || $[5] !== loginRoute || $[6] !== router || $[7] !== startRouteTransition || $[8] !== t) {
    t1 = async () => {
      if (!navigatingToLoginRef.current) {
        navigatingToLoginRef.current = true;
        await logOut();
        toast.success(t("authentication:loggedOutSuccessfully"));
        startRouteTransition(() => router.push(loginRoute));
        return;
      }
    };
    $[4] = logOut;
    $[5] = loginRoute;
    $[6] = router;
    $[7] = startRouteTransition;
    $[8] = t;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  const handleLogOut = t1;
  let t2;
  let t3;
  if ($[10] !== handleLogOut || $[11] !== inactivity || $[12] !== isLoggedIn || $[13] !== loginRoute || $[14] !== router || $[15] !== startRouteTransition) {
    t2 = () => {
      if (isLoggedIn && !inactivity) {
        handleLogOut();
      } else {
        if (!navigatingToLoginRef.current) {
          navigatingToLoginRef.current = true;
          startRouteTransition(() => router.push(loginRoute));
        }
      }
    };
    t3 = [handleLogOut, isLoggedIn, loginRoute, router, startRouteTransition, inactivity];
    $[10] = handleLogOut;
    $[11] = inactivity;
    $[12] = isLoggedIn;
    $[13] = loginRoute;
    $[14] = router;
    $[15] = startRouteTransition;
    $[16] = t2;
    $[17] = t3;
  } else {
    t2 = $[16];
    t3 = $[17];
  }
  useEffect(t2, t3);
  if (!isLoggedIn && inactivity) {
    let t4;
    if ($[18] !== loginRoute || $[19] !== t) {
      t4 = _jsxs("div", {
        className: `${baseClass}__wrap`,
        children: [_jsx("h2", {
          children: t("authentication:loggedOutInactivity")
        }), _jsx(Button, {
          buttonStyle: "secondary",
          el: "link",
          size: "large",
          url: loginRoute,
          children: t("authentication:logBackIn")
        })]
      });
      $[18] = loginRoute;
      $[19] = t;
      $[20] = t4;
    } else {
      t4 = $[20];
    }
    return t4;
  }
  let t4;
  if ($[21] !== t) {
    t4 = _jsx(LoadingOverlay, {
      animationDuration: "0ms",
      loadingText: t("authentication:loggingOut")
    });
    $[21] = t;
    $[22] = t4;
  } else {
    t4 = $[22];
  }
  return t4;
};
//# sourceMappingURL=LogoutClient.js.map