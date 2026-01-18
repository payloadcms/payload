'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { Modal } from '@faceless-ui/modal';
import React from 'react';
import { useEditDepth } from '../../providers/EditDepth/index.js';
export function FullscreenModal(props) {
  const $ = _c(3);
  const currentDepth = useEditDepth();
  let t0;
  if ($[0] !== currentDepth || $[1] !== props) {
    t0 = _jsx(Modal, {
      closeOnBlur: false,
      ...props,
      style: {
        ...(props.style || {}),
        zIndex: `calc(100 + ${currentDepth || 0} + 1)`
      }
    });
    $[0] = currentDepth;
    $[1] = props;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}
//# sourceMappingURL=index.js.map