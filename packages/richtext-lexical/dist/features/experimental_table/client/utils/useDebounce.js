'use client';

import { c as _c } from "react/compiler-runtime";
import { useCallback, useEffect, useRef } from 'react';
import debounce from './debounce.js';
export function useDebounce(fn, ms, maxWait) {
  const $ = _c(6);
  const debouncedRef = useRef(null);
  let t0;
  let t1;
  if ($[0] !== fn || $[1] !== maxWait || $[2] !== ms) {
    t0 = () => {
      debouncedRef.current = debounce(fn, ms, {
        maxWait
      });
      return () => {
        debouncedRef.current?.cancel();
      };
    };
    t1 = [fn, ms, maxWait];
    $[0] = fn;
    $[1] = maxWait;
    $[2] = ms;
    $[3] = t0;
    $[4] = t1;
  } else {
    t0 = $[3];
    t1 = $[4];
  }
  useEffect(t0, t1);
  let t2;
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = (...t3) => {
      const args = t3;
      if (debouncedRef.current) {
        debouncedRef.current(...args);
      }
    };
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const callback = t2;
  return callback;
}
//# sourceMappingURL=useDebounce.js.map