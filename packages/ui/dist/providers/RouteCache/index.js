'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { usePathname, useRouter } from 'next/navigation.js';
import React, { createContext, use, useCallback, useEffect, useRef } from 'react';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
const Context = /*#__PURE__*/createContext({
  cachingEnabled: true,
  clearRouteCache: () => {}
});
export const RouteCache = t0 => {
  const $ = _c(17);
  const {
    cachingEnabled: t1,
    children
  } = t0;
  const cachingEnabled = t1 === undefined ? true : t1;
  const pathname = usePathname();
  const router = useRouter();
  const clearAfterPathnameChange = useRef(false);
  let t2;
  if ($[0] !== router) {
    t2 = () => {
      router.refresh();
    };
    $[0] = router;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const clearRouteCache = t2;
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => {
      const handlePopState = () => {
        clearAfterPathnameChange.current = true;
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    };
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  let t4;
  if ($[3] !== router) {
    t4 = [router];
    $[3] = router;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  useEffect(t3, t4);
  let t5;
  if ($[5] !== cachingEnabled || $[6] !== clearRouteCache) {
    t5 = pathname_0 => {
      if (cachingEnabled || clearAfterPathnameChange.current) {
        clearAfterPathnameChange.current = false;
        clearRouteCache();
      }
    };
    $[5] = cachingEnabled;
    $[6] = clearRouteCache;
    $[7] = t5;
  } else {
    t5 = $[7];
  }
  const handlePathnameChange = useEffectEvent(t5);
  let t6;
  if ($[8] !== handlePathnameChange || $[9] !== pathname) {
    t6 = () => {
      handlePathnameChange(pathname);
    };
    $[8] = handlePathnameChange;
    $[9] = pathname;
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  let t7;
  if ($[11] !== pathname) {
    t7 = [pathname];
    $[11] = pathname;
    $[12] = t7;
  } else {
    t7 = $[12];
  }
  useEffect(t6, t7);
  let t8;
  if ($[13] !== cachingEnabled || $[14] !== children || $[15] !== clearRouteCache) {
    t8 = _jsx(Context, {
      value: {
        cachingEnabled,
        clearRouteCache
      },
      children
    });
    $[13] = cachingEnabled;
    $[14] = children;
    $[15] = clearRouteCache;
    $[16] = t8;
  } else {
    t8 = $[16];
  }
  return t8;
};
export const useRouteCache = () => use(Context);
//# sourceMappingURL=index.js.map