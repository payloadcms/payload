'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useRef, useState } from 'react';
export function useControllableState(propValue, fallbackValue) {
  const $ = _c(5);
  const [localValue, setLocalValue] = useState(propValue);
  const initialRenderRef = useRef(true);
  let t0;
  let t1;
  if ($[0] !== propValue) {
    t0 = () => {
      if (initialRenderRef.current) {
        initialRenderRef.current = false;
        return;
      }
      setLocalValue(propValue);
    };
    t1 = [propValue];
    $[0] = propValue;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useEffect(t0, t1);
  const t2 = localValue ?? fallbackValue;
  let t3;
  if ($[3] !== t2) {
    t3 = [t2, setLocalValue];
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
//# sourceMappingURL=useControllableState.js.map