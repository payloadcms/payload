'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useInlineBlockComponentContext } from '../index.js';
export const InlineBlockRemoveButton = () => {
  const $ = _c(2);
  const {
    RemoveButton
  } = useInlineBlockComponentContext();
  let t0;
  if ($[0] !== RemoveButton) {
    t0 = RemoveButton ? _jsx(RemoveButton, {}) : null;
    $[0] = RemoveButton;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
};
//# sourceMappingURL=InlineBlockRemoveButton.js.map