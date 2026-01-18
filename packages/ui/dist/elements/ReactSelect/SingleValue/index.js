'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { components as SelectComponents } from 'react-select';
const baseClass = 'react-select--single-value';
export const SingleValue = props => {
  const {
    children,
    className
  } = props;
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: /*#__PURE__*/_jsx(SelectComponents.SingleValue, {
      ...props,
      className: [baseClass, className].filter(Boolean).join(' '),
      children: children
    })
  });
};
//# sourceMappingURL=index.js.map