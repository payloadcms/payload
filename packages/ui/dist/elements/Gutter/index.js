'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'gutter';
export const Gutter = props => {
  const {
    children,
    className,
    left = true,
    negativeLeft = false,
    negativeRight = false,
    ref,
    right = true
  } = props;
  const shouldPadLeft = left && !negativeLeft;
  const shouldPadRight = right && !negativeRight;
  return /*#__PURE__*/_jsx("div", {
    className: [baseClass, shouldPadLeft && `${baseClass}--left`, shouldPadRight && `${baseClass}--right`, negativeLeft && `${baseClass}--negative-left`, negativeRight && `${baseClass}--negative-right`, className].filter(Boolean).join(' '),
    ref: ref,
    children: children
  });
};
//# sourceMappingURL=index.js.map