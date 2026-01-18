'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useRef, useState } from 'react';
export const useIntersect = (t0, disable) => {
  const $ = _c(8);
  const {
    root: t1,
    rootMargin: t2,
    threshold: t3
  } = t0 === undefined ? {} : t0;
  const root = t1 === undefined ? null : t1;
  const rootMargin = t2 === undefined ? "0px" : t2;
  const threshold = t3 === undefined ? 0 : t3;
  const [entry, updateEntry] = useState();
  const [node, setNode] = useState(null);
  const observer = useRef(typeof window !== "undefined" && "IntersectionObserver" in window && !disable ? new window.IntersectionObserver(t4 => {
    const [ent] = t4;
    return updateEntry(ent);
  }, {
    root,
    rootMargin,
    threshold
  }) : null);
  let t5;
  let t6;
  if ($[0] !== disable || $[1] !== node) {
    t5 = () => {
      if (disable) {
        return;
      }
      const {
        current: currentObserver
      } = observer;
      currentObserver.disconnect();
      if (node) {
        currentObserver.observe(node);
      }
      return () => currentObserver.disconnect();
    };
    t6 = [node, disable];
    $[0] = disable;
    $[1] = node;
    $[2] = t5;
    $[3] = t6;
  } else {
    t5 = $[2];
    t6 = $[3];
  }
  useEffect(t5, t6);
  let t7;
  if ($[4] !== entry || $[5] !== node || $[6] !== setNode) {
    t7 = [setNode, entry, node];
    $[4] = entry;
    $[5] = node;
    $[6] = setNode;
    $[7] = t7;
  } else {
    t7 = $[7];
  }
  return t7;
};
//# sourceMappingURL=useIntersect.js.map