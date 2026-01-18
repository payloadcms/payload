'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useInlineBlockComponentContext } from '../index.js';
export const InlineBlockEditButton = () => {
  const $ = _c(2);
  const {
    EditButton
  } = useInlineBlockComponentContext();
  let t0;
  if ($[0] !== EditButton) {
    t0 = EditButton ? _jsx(EditButton, {}) : null;
    $[0] = EditButton;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
};
//# sourceMappingURL=InlineBlockEditButton.js.map