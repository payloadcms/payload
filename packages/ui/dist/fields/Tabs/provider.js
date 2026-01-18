'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use } from 'react';
const Context = /*#__PURE__*/createContext(false);
export const TabsProvider = ({
  children,
  withinTab = true
}) => {
  return /*#__PURE__*/_jsx(Context, {
    value: withinTab,
    children: children
  });
};
export const useTabs = () => use(Context);
//# sourceMappingURL=provider.js.map