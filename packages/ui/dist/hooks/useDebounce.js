'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from 'react';
export function useDebounce(value, delay) {
  const $ = _c(4);
  const [debouncedValue, setDebouncedValue] = useState(value);
  let t0;
  let t1;
  if ($[0] !== delay || $[1] !== value) {
    t0 = () => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    };
    t1 = [value, delay];
    $[0] = delay;
    $[1] = value;
    $[2] = t0;
    $[3] = t1;
  } else {
    t0 = $[2];
    t1 = $[3];
  }
  useEffect(t0, t1);
  return debouncedValue;
}
//# sourceMappingURL=useDebounce.js.map