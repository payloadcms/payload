'use client';

import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { useDelay } from './useDelay.js';
export const useDelayedRender = t0 => {
  const $ = _c(13);
  const {
    delayBeforeShow,
    inTimeout,
    minShowTime,
    outTimeout,
    show
  } = t0;
  const totalMountTime = inTimeout + minShowTime + outTimeout;
  const [hasDelayed, triggerDelay] = useDelay(delayBeforeShow);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isUnmounting, setIsUnmounting] = React.useState(false);
  const onMountTimestampRef = React.useRef(0);
  const unmountTimeoutRef = React.useRef(undefined);
  let t1;
  if ($[0] !== outTimeout) {
    t1 = () => {
      setIsUnmounting(true);
      unmountTimeoutRef.current = setTimeout(() => {
        setIsMounted(false);
        setIsUnmounting(false);
      }, outTimeout);
    };
    $[0] = outTimeout;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const unmount = t1;
  let t2;
  let t3;
  if ($[2] !== hasDelayed || $[3] !== isMounted || $[4] !== show || $[5] !== totalMountTime || $[6] !== unmount) {
    t2 = () => {
      const shouldMount = hasDelayed && !isMounted && show;
      const shouldUnmount = isMounted && !show;
      if (shouldMount) {
        onMountTimestampRef.current = Date.now();
        setIsMounted(true);
      } else {
        if (shouldUnmount) {
          const totalTimeMounted = Date.now() - onMountTimestampRef.current;
          const remainingTime = totalMountTime - totalTimeMounted;
          clearTimeout(unmountTimeoutRef.current);
          unmountTimeoutRef.current = setTimeout(unmount, Math.max(0, remainingTime));
        }
      }
    };
    t3 = [isMounted, show, unmount, totalMountTime, hasDelayed];
    $[2] = hasDelayed;
    $[3] = isMounted;
    $[4] = show;
    $[5] = totalMountTime;
    $[6] = unmount;
    $[7] = t2;
    $[8] = t3;
  } else {
    t2 = $[7];
    t3 = $[8];
  }
  React.useEffect(t2, t3);
  let t4;
  if ($[9] !== isMounted || $[10] !== isUnmounting || $[11] !== triggerDelay) {
    t4 = {
      isMounted,
      isUnmounting,
      triggerDelayedRender: triggerDelay
    };
    $[9] = isMounted;
    $[10] = isUnmounting;
    $[11] = triggerDelay;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  return t4;
};
//# sourceMappingURL=useDelayedRender.js.map