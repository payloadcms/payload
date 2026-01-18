'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from 'react';
export function useDebouncedEffect(effect, deps, delay) {
  const $ = _c(11);
  let t0;
  if ($[0] !== effect) {
    t0 = () => effect;
    $[0] = effect;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const [debouncedEffect, setDebouncedEffect] = useState(t0);
  let t1;
  if ($[2] !== delay || $[3] !== effect) {
    t1 = () => {
      const handler = setTimeout(() => {
        setDebouncedEffect(() => effect);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    };
    $[2] = delay;
    $[3] = effect;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  let t2;
  if ($[5] !== delay || $[6] !== deps) {
    t2 = [...deps, delay];
    $[5] = delay;
    $[6] = deps;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  useEffect(t1, t2);
  let t3;
  let t4;
  if ($[8] !== debouncedEffect) {
    t3 = () => {
      debouncedEffect();
    };
    t4 = [debouncedEffect];
    $[8] = debouncedEffect;
    $[9] = t3;
    $[10] = t4;
  } else {
    t3 = $[9];
    t4 = $[10];
  }
  useEffect(t3, t4);
}
//# sourceMappingURL=useDebouncedEffect.js.map