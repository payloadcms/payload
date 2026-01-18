'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { ChevronIcon } from '../../../icons/Chevron/index.js';
import './index.scss';
const baseClass = 'dropdown-indicator';
export const DropdownIndicator = props => {
  const {
    innerProps: {
      ref,
      ...restInnerProps
    }
  } = props;
  return /*#__PURE__*/_jsx("button", {
    className: baseClass,
    ref: ref,
    ...restInnerProps,
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.key = ' ';
      }
    },
    type: "button",
    children: /*#__PURE__*/_jsx(ChevronIcon, {
      className: `${baseClass}__icon`
    })
  });
};
//# sourceMappingURL=index.js.map