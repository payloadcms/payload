'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useRef } from 'react';
/**
 * A hook that will throttle the execution of a callback function inside a useEffect.
 * This is useful for things like throttling loading states or other UI updates.
 * @param callback The callback function to be executed.
 * @param delay The delay in milliseconds to throttle the callback.
 * @param deps The dependencies to watch for changes.
 */
export const useThrottledEffect = (callback, delay, t0) => {
  const $ = _c(9);
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? [] : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const deps = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = Date.now();
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const lastRan = useRef(t2);
  let t3;
  if ($[3] !== callback || $[4] !== delay) {
    t3 = () => {
      const handler = setTimeout(() => {
        if (Date.now() - lastRan.current >= delay) {
          callback();
          lastRan.current = Date.now();
        }
      }, delay - (Date.now() - lastRan.current));
      return () => {
        clearTimeout(handler);
      };
    };
    $[3] = callback;
    $[4] = delay;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== delay || $[7] !== deps) {
    t4 = [delay, ...deps];
    $[6] = delay;
    $[7] = deps;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  useEffect(t3, t4);
};
//# sourceMappingURL=useThrottledEffect.js.map