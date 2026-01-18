'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { XIcon } from '../../../icons/X/index.js';
import './index.scss';
const baseClass = 'clear-indicator';
export const ClearIndicator = props => {
  const {
    clearValue,
    innerProps: {
      ref,
      ...restInnerProps
    }
  } = props;
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    // TODO Fix this - Broke with React 19 types
    ref: typeof ref === 'string' ? null : ref,
    ...restInnerProps,
    onKeyDown: e => {
      if (e.key === 'Enter') {
        clearValue();
        e.stopPropagation();
      }
    },
    role: "button",
    tabIndex: 0,
    children: /*#__PURE__*/_jsx(XIcon, {
      className: `${baseClass}__icon`
    })
  });
};
//# sourceMappingURL=index.js.map