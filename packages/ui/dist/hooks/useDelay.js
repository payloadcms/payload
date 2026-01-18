'use client';

import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
export const useDelay = (delay, t0) => {
  const $ = _c(9);
  const triggerOnMount = t0 === undefined ? false : t0;
  const [hasDelayed, setHasDelayed] = React.useState(false);
  const triggerTimeoutRef = React.useRef(undefined);
  let t1;
  if ($[0] !== delay) {
    t1 = () => {
      setHasDelayed(false);
      clearTimeout(triggerTimeoutRef.current);
      triggerTimeoutRef.current = setTimeout(() => {
        setHasDelayed(true);
      }, delay);
      return () => {
        clearTimeout(triggerTimeoutRef.current);
      };
    };
    $[0] = delay;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const triggerDelay = t1;
  let t2;
  let t3;
  if ($[2] !== triggerDelay || $[3] !== triggerOnMount) {
    t2 = () => {
      if (triggerOnMount) {
        triggerDelay();
      }
    };
    t3 = [triggerDelay, triggerOnMount];
    $[2] = triggerDelay;
    $[3] = triggerOnMount;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  React.useEffect(t2, t3);
  let t4;
  if ($[6] !== hasDelayed || $[7] !== triggerDelay) {
    t4 = [hasDelayed, triggerDelay];
    $[6] = hasDelayed;
    $[7] = triggerDelay;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
};
//# sourceMappingURL=useDelay.js.map