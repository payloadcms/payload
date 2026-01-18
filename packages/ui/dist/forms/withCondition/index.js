'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { WatchCondition } from './WatchCondition.js';
export const withCondition = Field => {
  const CheckForCondition = props => {
    const {
      path
    } = props;
    return /*#__PURE__*/_jsx(WatchCondition, {
      path: path,
      children: /*#__PURE__*/_jsx(Field, {
        ...props
      })
    });
  };
  return CheckForCondition;
};
//# sourceMappingURL=index.js.map