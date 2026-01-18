'use client';

import { c as _c } from "react/compiler-runtime";
import { useCallback, useRef } from 'react';
/**
 * Returns a memoized function that will only call the passed function when it hasn't been called for the wait period
 * @param func The function to be called
 * @param wait Wait period after function hasn't been called for
 * @returns A memoized function that is debounced
 */
export const useDebouncedCallback = (func, wait) => {
  const $ = _c(3);
  const timeout = useRef(undefined);
  let t0;
  if ($[0] !== func || $[1] !== wait) {
    t0 = (...t1) => {
      const args = t1;
      const later = () => {
        clearTimeout(timeout.current);
        func(...args);
      };
      clearTimeout(timeout.current);
      timeout.current = setTimeout(later, wait);
    };
    $[0] = func;
    $[1] = wait;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
};
//# sourceMappingURL=useDebouncedCallback.js.map