'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { components as SelectComponents } from 'react-select';
export const Input = props => {
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: /*#__PURE__*/_jsx(SelectComponents.Input, {
      ...props,
      /**
      * Adding `aria-activedescendant` fixes hydration error
      * source: https://github.com/JedWatson/react-select/issues/5459#issuecomment-1878037196
      */
      "aria-activedescendant": undefined
    })
  });
};
//# sourceMappingURL=index.js.map