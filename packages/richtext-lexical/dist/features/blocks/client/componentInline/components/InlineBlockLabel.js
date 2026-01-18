'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useInlineBlockComponentContext } from '../index.js';
export const InlineBlockLabel = () => {
  const $ = _c(2);
  const {
    Label
  } = useInlineBlockComponentContext();
  let t0;
  if ($[0] !== Label) {
    t0 = Label ? _jsx(Label, {}) : null;
    $[0] = Label;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
};
//# sourceMappingURL=InlineBlockLabel.js.map