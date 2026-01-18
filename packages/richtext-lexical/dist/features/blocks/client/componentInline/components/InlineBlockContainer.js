'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useInlineBlockComponentContext } from '../index.js';
export const InlineBlockContainer = t0 => {
  const $ = _c(3);
  const {
    children
  } = t0;
  const {
    InlineBlockContainer
  } = useInlineBlockComponentContext();
  let t1;
  if ($[0] !== InlineBlockContainer || $[1] !== children) {
    t1 = InlineBlockContainer ? _jsx(InlineBlockContainer, {
      children
    }) : null;
    $[0] = InlineBlockContainer;
    $[1] = children;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
//# sourceMappingURL=InlineBlockContainer.js.map