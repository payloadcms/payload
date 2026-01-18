'use client';

import { c as _c } from "react/compiler-runtime";
import { toast, useRouteTransition } from '@payloadcms/ui';
import { useRouter } from 'next/navigation.js';
import React, { useEffect } from 'react';
export function ToastAndRedirect(t0) {
  const $ = _c(6);
  const {
    message,
    redirectTo
  } = t0;
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  const hasToastedRef = React.useRef(false);
  let t1;
  let t2;
  if ($[0] !== message || $[1] !== redirectTo || $[2] !== router || $[3] !== startRouteTransition) {
    t1 = () => {
      let timeoutID;
      if (toast) {
        timeoutID = setTimeout(() => {
          toast.success(message);
          hasToastedRef.current = true;
          startRouteTransition(() => router.push(redirectTo));
        }, 100);
      }
      return () => {
        if (timeoutID) {
          clearTimeout(timeoutID);
        }
      };
    };
    t2 = [router, redirectTo, message, startRouteTransition];
    $[0] = message;
    $[1] = redirectTo;
    $[2] = router;
    $[3] = startRouteTransition;
    $[4] = t1;
    $[5] = t2;
  } else {
    t1 = $[4];
    t2 = $[5];
  }
  useEffect(t1, t2);
  return null;
}
//# sourceMappingURL=index.client.js.map