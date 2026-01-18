'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { ChevronIcon } from '../../../icons/Chevron/index.js';
import './index.scss';
const baseClass = 'clickable-arrow';
export const ClickableArrow = props => {
  const {
    direction = 'right',
    isDisabled = false,
    updatePage
  } = props;
  const classes = [baseClass, isDisabled && `${baseClass}--is-disabled`, direction && `${baseClass}--${direction}`].filter(Boolean).join(' ');
  return /*#__PURE__*/_jsx("button", {
    className: classes,
    disabled: isDisabled,
    onClick: !isDisabled ? updatePage : undefined,
    type: "button",
    children: /*#__PURE__*/_jsx(ChevronIcon, {})
  });
};
//# sourceMappingURL=index.js.map