'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useIntersect } from '../../hooks/useIntersect.js';
export const RenderIfInViewport = t0 => {
  const $ = _c(9);
  const {
    children,
    className,
    forceRender
  } = t0;
  const [hasRendered, setHasRendered] = React.useState(Boolean(forceRender));
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      rootMargin: "1000px"
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [intersectionRef, entry] = useIntersect(t1, Boolean(forceRender));
  const isIntersecting = Boolean(entry?.isIntersecting);
  const isAboveViewport = entry?.boundingClientRect?.top < 0;
  const shouldRender = forceRender || isIntersecting || isAboveViewport;
  let t2;
  let t3;
  if ($[1] !== hasRendered || $[2] !== shouldRender) {
    t2 = () => {
      if (shouldRender && !hasRendered) {
        setHasRendered(true);
      }
    };
    t3 = [shouldRender, hasRendered];
    $[1] = hasRendered;
    $[2] = shouldRender;
    $[3] = t2;
    $[4] = t3;
  } else {
    t2 = $[3];
    t3 = $[4];
  }
  React.useEffect(t2, t3);
  const t4 = hasRendered ? children : null;
  let t5;
  if ($[5] !== className || $[6] !== intersectionRef || $[7] !== t4) {
    t5 = _jsx("div", {
      className,
      ref: intersectionRef,
      children: t4
    });
    $[5] = className;
    $[6] = intersectionRef;
    $[7] = t4;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  return t5;
};
//# sourceMappingURL=index.js.map